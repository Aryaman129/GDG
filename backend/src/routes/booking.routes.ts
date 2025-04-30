import { Router, Request, Response, RequestHandler, NextFunction } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import QRCode from "qrcode";
import { createCalendarEvent } from "../utils/googleCalendar"; // Import the calendar utility
import { addHours } from "date-fns"; // Helper for calculating end time
import { sendEmail } from "../utils/emailService"; // Import email service

const router = Router();
const prisma = new PrismaClient();

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  return;
};

// --- POST /api/bookings - Create a new booking ---
const createBookingHandler = asyncHandler(async (req, res, next) => {
  const userId = req.user?.userId;
  const userEmail = req.user?.email;
  const { slotId } = req.body;

  if (!slotId) {
    res.status(400).json({ error: "slotId is required." });
    return;
  }

  let bookingResult: any = null; // To store the result from the transaction

  try {
    // Use a transaction to ensure atomicity
    bookingResult = await prisma.$transaction(async (tx) => {
      // 1. Find the requested slot and lock it for update
      const slot = await tx.sessionSlot.findUnique({
        where: { id: slotId },
        include: {
          speaker: {
            include: {
              profile: {
                select: { id: true, full_name: true, email: true }
              }
            }
          }
        }
      });

      if (!slot) {
        throw new Error("Slot not found.");
      }

      if (slot.is_booked) {
        throw new Error("Slot is already booked.");
      }

      // 2. Mark the slot as booked
      await tx.sessionSlot.update({
        where: { id: slotId },
        data: { is_booked: true },
      });

      // 3. Create the booking record
      const newBooking = await tx.booking.create({
        data: {
          user_id: userId!,
          slot_id: slotId,
          // qr_code_url will be generated next
          // calendar_event_id will be added later
        },
        include: {
          // Include related data needed for QR code and Calendar
          slot: {
            select: {
              speaker_id: true,
              session_date: true,
              hour: true,
              speaker: {
                include: {
                  profile: {
                    select: { id: true, full_name: true, email: true }
                  }
                }
              }
            }
          },
          user: {
            select: { full_name: true, email: true }
          }
        }
      });

      // 4. Generate QR Code Payload
      const qrPayload = JSON.stringify({
        bookingId: newBooking.id,
        userId: newBooking.user_id,
        speakerId: newBooking.slot.speaker_id,
        date: newBooking.slot.session_date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        hour: newBooking.slot.hour,
      });

      // 5. Generate QR Code Image (as Data URL)
      const qrCodeUrl = await QRCode.toDataURL(qrPayload);

      // 6. Update booking with QR code URL
      const updatedBooking = await tx.booking.update({
        where: { id: newBooking.id },
        data: { qr_code_url: qrCodeUrl },
        include: {
          slot: {
            include: {
              speaker: {
                include: {
                  profile: { select: { id: true, full_name: true, email: true } }
                }
              }
            }
          },
          user: { select: { full_name: true, email: true } }
        }
      });

      return updatedBooking; // Return the final booking object
    });

    // --- Google Calendar Integration (Outside Transaction) ---
    if (bookingResult) {
      const speaker = bookingResult.slot.speaker.profile;
      const user = bookingResult.user;
      const slotDate = bookingResult.slot.session_date;
      const slotHour = bookingResult.slot.hour;

      // Calculate start and end times (assuming 1-hour slots)
      const startTime = new Date(slotDate);
      startTime.setUTCHours(slotHour, 0, 0, 0); // Set time in UTC
      const endTime = addHours(startTime, 1);

      const eventDetails = {
        summary: `Session: ${speaker.full_name} & ${user.full_name}`,
        description: `Booked session between ${speaker.full_name} (Speaker) and ${user.full_name} (Attendee).`,
        startTime: startTime,
        endTime: endTime,
        attendees: [
          { email: speaker.email },
          { email: user.email },
        ],
        // TODO: Pass speaker's OAuth tokens here for authentication
        // speakerAuthTokens: { access_token: 'SPEAKER_ACCESS_TOKEN', refresh_token: 'SPEAKER_REFRESH_TOKEN' }
      };

      console.log("Attempting to create Google Calendar event...");
      const calendarEventId = await createCalendarEvent(eventDetails);

      if (calendarEventId) {
        console.log(`Google Calendar event created with ID: ${calendarEventId}`);
        // Optionally: Update the booking record with the calendarEventId
        try {
          await prisma.booking.update({
            where: { id: bookingResult.id },
            data: { calendar_event_id: calendarEventId },
          });
          console.log(`Booking record ${bookingResult.id} updated with calendar event ID.`);
        } catch (updateError) {
          console.error(`Failed to update booking ${bookingResult.id} with calendar event ID:`, updateError);
        }
      } else {
        console.warn(`Failed to create Google Calendar event for booking ${bookingResult.id}.`);
      }
    }

    // Send email notification with QR code
    if (bookingResult && bookingResult.qr_code_url) {
      try {
        const speaker = bookingResult.slot.speaker.profile;
        const user = bookingResult.user;
        const slotDate = bookingResult.slot.session_date;
        const slotHour = bookingResult.slot.hour;

        // Import the function from the top of the file
        const { sendBookingConfirmationEmail } = require('../utils/emailService');

        await sendBookingConfirmationEmail(
          user.email,
          user.full_name,
          speaker.full_name,
          slotDate,
          slotHour,
          bookingResult.qr_code_url
        );

        console.log(`Booking confirmation email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
        // Don't fail the request if email sending fails
      }
    }

    res.status(201).json(bookingResult);
  } catch (error: any) {
    console.error(`Error creating booking for user ${userId}, slot ${slotId}:`, error);
    if (error.message === "Slot not found." || error.message === "Slot is already booked.") {
      res.status(409).json({ error: error.message }); // Conflict
      return;
    }
    next(error); // Pass other errors to Express error handler
  }
});

// --- GET /api/bookings/my - Get bookings for the authenticated user ---
const getMyBookingsHandler = asyncHandler(async (req, res, next) => {
  const userId = req.user?.userId;

  try {
    const bookings = await prisma.booking.findMany({
      where: { user_id: userId! },
      include: {
        slot: {
          include: {
            speaker: {
              include: {
                profile: {
                  // Include speaker's name
                  select: { full_name: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: "desc", // Show most recent first
      },
    });
    res.status(200).json(bookings);
  } catch (error) {
    console.error(`Error fetching bookings for user ${userId}:`, error);
    next(error);
  }
});

// --- GET /api/bookings/:id/qr - Get QR code for a specific booking ---
const getBookingQrHandler = asyncHandler(async (req, res, next) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const bookingId = parseInt(id, 10);

  if (isNaN(bookingId)) {
    res.status(400).json({ error: "Invalid booking ID." });
    return;
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { qr_code_url: true, user_id: true }
    });

    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }

    // Security check: Users can only access their own bookings
    if (booking.user_id !== userId) {
      res.status(403).json({ error: "Access denied. This booking belongs to another user." });
      return;
    }

    if (!booking.qr_code_url) {
      res.status(404).json({ error: "QR code not found for this booking." });
      return;
    }

    res.status(200).json({ qr_code_url: booking.qr_code_url });
  } catch (error) {
    console.error(`Error fetching QR code for booking ${bookingId}:`, error);
    next(error);
  }
});

// --- GET /api/bookings/speaker - Get bookings for the authenticated speaker ---
const getSpeakerBookingsHandler = asyncHandler(async (req, res, next) => {
  const speakerId = req.user?.userId;

  try {
    // Verify the user is a speaker
    const speakerProfile = await prisma.speakerProfile.findUnique({
      where: { id: speakerId! }
    });

    if (!speakerProfile) {
      return res.status(403).json({ error: "Access denied. Only speakers can access this endpoint." });
    }

    // Find all bookings for this speaker's slots
    const bookings = await prisma.booking.findMany({
      where: {
        slot: {
          speaker_id: speakerId!
        }
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        slot: {
          select: {
            id: true,
            session_date: true,
            hour: true
          }
        }
      },
      orderBy: [
        { slot: { session_date: 'desc' } },
        { slot: { hour: 'asc' } }
      ]
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error(`Error fetching bookings for speaker ${speakerId}:`, error);
    next(error);
  }
});

// --- Assign handlers to routes ---
router.post("/", authenticateToken, authorizeRole([Role.USER]), createBookingHandler);
router.get("/my", authenticateToken, getMyBookingsHandler);
router.get("/speaker", authenticateToken, authorizeRole([Role.SPEAKER]), getSpeakerBookingsHandler);
router.get("/:id/qr", authenticateToken, getBookingQrHandler);

export default router;

