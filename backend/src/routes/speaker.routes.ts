import { Router, Request, Response, RequestHandler, NextFunction } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { parse, isValid, startOfDay } from "date-fns";

const router = Router();
const prisma = new PrismaClient();

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  return;
};

// --- GET /api/speakers - List all speakers ---
const listSpeakersHandler = asyncHandler(async (_req, res, next) => {
  try {
    const speakers = await prisma.speakerProfile.findMany({
      select: {
        id: true,
        expertise: true,
        bio: true,
        price_per_hour: true,
        profile: {
          select: {
            full_name: true,
            email: true,
            // Do not select sensitive info like otp_verified
          },
        },
      },
      orderBy: {
        profile: {
          full_name: "asc",
        },
      },
    });

    // Format the response to be more frontend-friendly
    const formattedSpeakers = speakers.map(speaker => ({
      id: speaker.id,
      fullName: speaker.profile.full_name,
      email: speaker.profile.email,
      expertise: speaker.expertise,
      bio: speaker.bio,
      pricePerHour: speaker.price_per_hour
    }));

    res.status(200).json(formattedSpeakers);
  } catch (error) {
    console.error("Error fetching speakers:", error);
    next(error);
  }
});

// --- PUT /api/speakers/me - Update speaker profile (expertise, price) ---
const updateSpeakerProfileHandler = asyncHandler(async (req, res, next) => {
  const speakerUserId = req.user?.userId;
  const { expertise, price_per_hour, bio } = req.body;

  // Basic validation
  if (expertise === undefined && price_per_hour === undefined && bio === undefined) {
    res.status(400).json({ error: "At least one field (expertise, price_per_hour, bio) must be provided." });
    return;
  }

  const dataToUpdate: { expertise?: string; price_per_hour?: number; bio?: string } = {};
  if (expertise !== undefined) {
    dataToUpdate.expertise = expertise;
  }
  if (price_per_hour !== undefined) {
    const price = parseFloat(price_per_hour);
    if (isNaN(price) || price < 0) {
        res.status(400).json({ error: "Invalid price_per_hour. Must be a non-negative number." });
        return;
    }
    dataToUpdate.price_per_hour = price;
  }
  if (bio !== undefined) {
    dataToUpdate.bio = bio;
  }

  try {
    // First check if the speaker profile exists
    const speakerProfile = await prisma.speakerProfile.findUnique({
      where: { id: speakerUserId! }
    });

    if (!speakerProfile) {
      console.log(`Speaker profile not found for user ${speakerUserId}`);

      // Create a speaker profile if it doesn't exist
      console.log("DEMO MODE: Creating speaker profile for demo user");

      try {
        // Check if the user exists in the profile table
        const userProfile = await prisma.profile.findUnique({
          where: { id: speakerUserId! }
        });

        if (!userProfile) {
          return res.status(404).json({
            error: "User profile not found. Cannot create speaker profile."
          });
        }

        // Create a speaker profile with the provided data
        const newSpeakerProfile = await prisma.speakerProfile.create({
          data: {
            id: speakerUserId!,
            expertise: expertise || "Demo Expertise",
            bio: bio || "This is a demo speaker for testing purposes.",
            price_per_hour: price_per_hour ? parseFloat(price_per_hour) : 100
          },
          include: {
            profile: { select: { full_name: true, email: true } },
          },
        });

        console.log("DEMO MODE: Speaker profile created successfully");
        return res.status(201).json(newSpeakerProfile);
      } catch (profileError) {
        console.error("Error creating speaker profile:", profileError);
        return res.status(500).json({
          error: "Failed to create speaker profile. Please try again."
        });
      }
    }

    // Update the existing speaker profile
    const updatedSpeakerProfile = await prisma.speakerProfile.update({
      where: { id: speakerUserId },
      data: dataToUpdate,
      include: {
        profile: { select: { full_name: true, email: true } },
      },
    });
    res.status(200).json(updatedSpeakerProfile);
  } catch (error: any) {
    // Handle potential errors like speaker profile not found (P2025)
    if (error.code === "P2025") {
      res.status(404).json({ error: "Speaker profile not found." });
      return;
    }
    console.error(`Error updating speaker profile for user ${speakerUserId}:`, error);
    next(error);
  }
});

// --- GET /api/speakers/slots/:speakerId - Get available slots for a speaker ---
const getSpeakerSlotsHandler = asyncHandler(async (req, res, next) => {
  const { speakerId } = req.params;
  const dateQuery = req.query.date as string; // Expecting YYYY-MM-DD

  if (!dateQuery) {
    res.status(400).json({ error: "Date query parameter (YYYY-MM-DD) is required." });
    return;
  }

  const requestedDate = parse(dateQuery, "yyyy-MM-dd", new Date());

  if (!isValid(requestedDate)) {
    res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
    return;
  }

  try {
    // Check if speaker exists
    const speakerExists = await prisma.speakerProfile.findUnique({ where: { id: speakerId } });
    if (!speakerExists) {
        res.status(404).json({ error: "Speaker not found." });
        return;
    }

    // Check if the request is from the speaker themselves (to show all slots)
    // or from another user (to show only available slots)
    const isOwnProfile = req.user?.userId === speakerId;

    const slots = await prisma.sessionSlot.findMany({
      where: {
        speaker_id: speakerId,
        session_date: startOfDay(requestedDate), // Compare against the date part only
        ...(isOwnProfile ? {} : { is_booked: false }), // Show all slots for the speaker, but only available slots for others
      },
      orderBy: {
        hour: "asc",
      },
      select: { // Select necessary fields
        id: true,
        session_date: true,
        hour: true,
        is_booked: true,
      }
    });
    res.status(200).json(slots);
  } catch (error) {
    console.error(`Error fetching slots for speaker ${speakerId} on ${dateQuery}:`, error);
    next(error);
  }
});

// --- POST /api/speakers/slots - Create a new availability slot ---
const createSlotHandler = asyncHandler(async (req, res, next) => {
  const speakerUserId = req.user?.userId;
  const { session_date, hour } = req.body; // Expecting date as YYYY-MM-DD, hour as number 9-16

  if (!session_date || hour === undefined) {
    res.status(400).json({ error: "session_date (YYYY-MM-DD) and hour (number) are required." });
    return;
  }

  const requestedDate = parse(session_date, "yyyy-MM-dd", new Date());
  const requestedHour = parseInt(hour, 10);

  if (!isValid(requestedDate)) {
    res.status(400).json({ error: "Invalid date format for session_date. Please use YYYY-MM-DD." });
    return;
  }

  // Validate hour is within 9 AM to 4 PM (inclusive)
  if (isNaN(requestedHour) || requestedHour < 9 || requestedHour > 16) {
    res.status(400).json({ error: "Invalid hour. Must be a number between 9 and 16 (inclusive)." });
    return;
  }

  const now = new Date();
  const slotDateTime = new Date(requestedDate);
  slotDateTime.setHours(requestedHour, 0, 0, 0);

  // Prevent creating slots in the past
  if (slotDateTime < startOfDay(now)) { // Allow creating slots for today
      res.status(400).json({ error: "Cannot create slots for past dates." });
      return;
  }

  try {
    // First check if the speaker profile exists
    const speakerProfile = await prisma.speakerProfile.findUnique({
      where: { id: speakerUserId! }
    });

    if (!speakerProfile) {
      console.log(`Speaker profile not found for user ${speakerUserId}`);

      // Create a speaker profile if it doesn't exist
      console.log("DEMO MODE: Creating speaker profile for demo user");

      try {
        // Check if the user exists in the profile table
        const userProfile = await prisma.profile.findUnique({
          where: { id: speakerUserId! }
        });

        if (!userProfile) {
          return res.status(404).json({
            error: "User profile not found. Cannot create speaker profile."
          });
        }

        // Create a speaker profile
        await prisma.speakerProfile.create({
          data: {
            id: speakerUserId!,
            expertise: "Demo Expertise",
            bio: "This is a demo speaker for testing purposes.",
            price_per_hour: 100
          }
        });

        console.log("DEMO MODE: Speaker profile created successfully");
      } catch (profileError) {
        console.error("Error creating speaker profile:", profileError);
        return res.status(500).json({
          error: "Failed to create speaker profile. Please try again."
        });
      }
    }

    // Now create the slot
    const newSlot = await prisma.sessionSlot.create({
      data: {
        speaker_id: speakerUserId!,
        session_date: startOfDay(requestedDate), // Store only the date part
        hour: requestedHour,
        is_booked: false,
      },
    });
    res.status(201).json(newSlot);
  } catch (error: any) {
    // Handle unique constraint violation (slot already exists)
    if (error.code === "P2002") {
      res.status(409).json({ error: "This time slot already exists for this date." });
      return;
    }
    // Handle foreign key constraint violation
    if (error.code === "P2003") {
      res.status(400).json({ error: "Invalid speaker ID. Speaker profile may not exist." });
      return;
    }
    console.error(`Error creating slot for speaker ${speakerUserId}:`, error);
    next(error);
  }
});

// --- Assign handlers and middleware to routes ---
router.get("/", listSpeakersHandler); // List all speakers (public endpoint)
router.put("/me", authenticateToken, authorizeRole([Role.SPEAKER]), updateSpeakerProfileHandler); // Update own profile
router.get("/slots/:speakerId", getSpeakerSlotsHandler); // Get slots for a specific speaker (public for demo)
router.post("/slots", authenticateToken, authorizeRole([Role.SPEAKER]), createSlotHandler); // Create new slot (speaker only)

export default router;

