import { Router, Request, Response, RequestHandler, NextFunction } from "express";
import { PrismaClient, Role } from "@prisma/client";
// Google Calendar functionality completely removed
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

// --- Twilio Setup ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;
if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
  try {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
    console.log("Twilio client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error);
    // Proceed without Twilio if setup fails, log error
  }
} else {
  console.warn("Twilio credentials not fully configured in .env. SMS OTP will not function.");
}

// Helper to wrap async route handlers and catch errors
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  return;
};

// --- OTP Generation Helper ---
const generateOtp = (length = 6): string => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

// --- Signup Handler ---
const signupHandler = asyncHandler(async (req, res, next) => {
  const { email, password, fullName, phone, role } = req.body; // Added phone for OTP

  if (!email || !password || !fullName || !phone) {
    return res
      .status(400)
      .json({ error: "Email, password, full name, and phone number are required." });
  }

  // Validate role if provided, default to USER
  const userRole = role && ["USER", "SPEAKER", "ADMIN"].includes(role.toUpperCase())
      ? (role.toUpperCase() as Role)
      : Role.USER;

  try {
    // Check if user already exists
    const existingUser = await prisma.profile.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists." });
    }

    // Generate a UUID for the new user
    const userId = uuidv4();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Create profile in database
    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: email,
        password: hashedPassword,
        full_name: fullName,
        phone: phone,
        role: userRole,
        otp_verified: false, // Require OTP verification for demo
      },
    });

    // Log OTP for demo purposes
    console.log(`Generated OTP for ${email}: ${otp}`);

    // If the role is SPEAKER, create an entry in speaker_profiles
    if (userRole === Role.SPEAKER) {
      await prisma.speakerProfile.create({
        data: {
          id: userId,
        },
      });
    }

    // Send OTP via Twilio SMS (if configured)
    let otpSent = false;
    if (twilioClient && twilioPhoneNumber) {
      try {
        await twilioClient.messages.create({
          body: `Your verification code is: ${otp}`,
          from: twilioPhoneNumber,
          to: phone,
        });
        console.log(`OTP sent successfully to ${phone}`);
        otpSent = true;
      } catch (twilioError: any) {
        console.error(`Failed to send OTP to ${phone}:`, twilioError.message);
      }
    }

    res.status(201).json({
      message: `User created successfully. DEMO VERSION: No real OTP has been sent. Please enter any 6-digit number (e.g., 123456) to verify your account.`,
      userId: userId,
      demoOtp: "123456", // For demo purposes only
    });

  } catch (error: any) {
    console.error("Signup Error:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return res.status(409).json({ error: "User with this email already exists." });
    }
    next(error); // Pass other errors to Express error handler
  }
});

// --- OTP Verification Handler ---
const verifyOtpHandler = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  try {
    // Find user profile
    const profile = await prisma.profile.findUnique({
      where: { email: email },
    });

    if (!profile) {
      return res.status(404).json({ error: "User not found." });
    }

    if (profile.otp_verified) {
      return res.status(400).json({ error: "Account already verified." });
    }

    // For demo purposes, accept any OTP code that is 6 digits
    const isValidOtp = /^\d{6}$/.test(otp);

    if (!isValidOtp) {
      return res.status(400).json({ error: "Invalid OTP format. Must be 6 digits." });
    }

    // For demo, we'll accept any valid 6-digit OTP
    const isMatch = true;

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP." });
    }

    // Mark profile as verified
    await prisma.profile.update({
      where: { email: email },
      data: {
        otp_verified: true,
      },
    });

    res.status(200).json({ message: "OTP verified successfully. You can now log in." });

  } catch (error) {
    console.error("OTP Verification Error:", error);
    next(error);
  }
});

// --- Login Handler ---
const loginHandler = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Fetch user profile
    const userProfile = await prisma.profile.findUnique({
      where: { email: email },
    });

    if (!userProfile) {
      return res.status(401).json({ error: "Invalid login credentials." }); // User not found
    }

    if (!userProfile.otp_verified) {
      return res.status(403).json({ error: "Account not verified. Please verify OTP first." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userProfile.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid login credentials." });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userProfile.id,
        email: userProfile.email,
        role: userProfile.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return session and user details
    res.status(200).json({
      message: "Login successful",
      session: {
        access_token: token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      user: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        role: userProfile.role,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    next(error);
  }
});

// --- Assign handlers to routes ---
router.post("/signup", signupHandler);
router.post("/verify-otp", verifyOtpHandler);
router.post("/login", loginHandler);

// Google OAuth routes
// Initiate Google OAuth flow
router.get("/google", (req, res) => {
  try {
    const authUrl = getGoogleAuthUrl();
    // Instead of redirecting directly, send the URL as a response
    // This avoids issues with path-to-regexp
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error("Error generating Google auth URL:", error);
    res.status(500).json({ error: "Failed to generate Google auth URL" });
  }
});

// Handle Google OAuth callback
router.get("/google/callback", asyncHandler(async (req, res, next) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    const result = await handleGoogleCallback(code);

    if (!result.success) {
      return res.status(500).json({ error: "Failed to get Google tokens", details: result.error });
    }

    // In a real application, you would:
    // 1. Store the tokens in your database, associated with the user
    // 2. Create or update the user's profile
    // 3. Generate a session token

    // For demo purposes, we'll just return the tokens
    res.status(200).json({
      message: "Google authentication successful",
      // Don't expose tokens in production
      tokens: result.tokens
    });

  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    next(error);
  }
}));

export default router;

