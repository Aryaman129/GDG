import { Router, Request, Response, RequestHandler, NextFunction } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";

const router = Router();
const prisma = new PrismaClient();

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  return;
};

// --- POST /api/admin/checkin - Check in a user via QR code payload ---
const checkInHandler = asyncHandler(async (req, res, next) => {
  const { qrPayload } = req.body; // Expecting the JSON string from the QR code

  if (!qrPayload) {
    res.status(400).json({ error: "qrPayload is required." });
    return;
  }

  let bookingDetails: {
    bookingId: number;
    userId: string;
    speakerId: string;
    date: string;
    hour: number;
  };

  try {
    bookingDetails = JSON.parse(qrPayload);
    if (
      !bookingDetails.bookingId ||
      !bookingDetails.userId ||
      !bookingDetails.speakerId ||
      !bookingDetails.date ||
      bookingDetails.hour === undefined
    ) {
      throw new Error("Invalid QR payload structure.");
    }
  } catch (error) {
    console.error("Error parsing QR payload:", error);
    res.status(400).json({ error: "Invalid or malformed QR code payload." });
    return;
  }

  try {
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingDetails.bookingId },
      include: {
        slot: true, // Include slot to verify details if needed
      },
    });

    if (!booking) {
      res.status(404).json({ error: "Booking not found for this QR code." });
      return;
    }

    // Optional: Add more validation against the payload details and booking record
    // e.g., if (booking.user_id !== bookingDetails.userId || booking.slot.speaker_id !== bookingDetails.speakerId) ...

    if (booking.checked_in) {
      res.status(409).json({ error: "This booking has already been checked in." });
      return;
    }

    // Mark as checked in
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingDetails.bookingId },
      data: { checked_in: true },
      include: {
        user: { select: { full_name: true, email: true } },
        slot: {
          include: {
            speaker: { include: { profile: { select: { full_name: true } } } },
          },
        },
      },
    });

    res.status(200).json({
      message: `Successfully checked in ${updatedBooking.user.full_name} for session with ${updatedBooking.slot.speaker.profile.full_name}.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error(`Error checking in booking ${bookingDetails.bookingId}:`, error);
    next(error);
  }
});

// --- GET /api/admin/stats - Get booking statistics ---
const getStatsHandler = asyncHandler(async (req, res, next) => {
  try {
    const totalBookings = await prisma.booking.count();
    const checkedInBookings = await prisma.booking.count({
      where: { checked_in: true },
    });

    // Get bookings by speaker with proper join
    const bookingsBySpeaker = await prisma.booking.findMany({
      include: {
        slot: {
          include: {
            speaker: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    });

    // Process the data to get speaker stats
    const speakerCounts: Record<string, number> = {};

    bookingsBySpeaker.forEach(booking => {
      // Handle potential null values in the chain
      if (!booking.slot || !booking.slot.speaker || !booking.slot.speaker.profile) {
        return; // Skip this booking if any part of the chain is null
      }

      const speakerName = booking.slot.speaker.profile.full_name || 'Unknown';
      if (speakerCounts[speakerName]) {
        speakerCounts[speakerName]++;
      } else {
        speakerCounts[speakerName] = 1;
      }
    });

    // Convert to array and sort
    const speakerStats = Object.entries(speakerCounts)
      .map(([speakerName, count]) => ({ speakerName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.status(200).json({
      totalBookings,
      checkedInBookings,
      checkedInPercentage: totalBookings > 0 ? Math.round((checkedInBookings / totalBookings) * 100) : 0,
      topSpeakers: speakerStats
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    next(error);
  }
});

// --- Assign handlers to routes (Protected by Admin role) ---
router.post("/checkin", authenticateToken, authorizeRole([Role.ADMIN]), checkInHandler);
router.get("/stats", authenticateToken, authorizeRole([Role.ADMIN]), getStatsHandler);

export default router;
