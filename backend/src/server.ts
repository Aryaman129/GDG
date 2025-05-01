import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient, Role } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";

// Import routes
import authRoutes from "./routes/auth.routes";
import speakerRoutes from "./routes/speaker.routes";
import bookingRoutes from "./routes/booking.routes";
import adminRoutes from "./routes/admin.routes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;
const prisma = new PrismaClient();

// --- Middleware ---
// Configure CORS with environment variable or allow all origins
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly
// In Express 5, we need to use a RegExp instead of '*'
app.options(/(.*)/, cors(corsOptions));

app.use(express.json()); // Middleware to parse JSON bodies

// --- Basic Routes ---
app.get("/", (req: Request, res: Response) => {
  res.send("Conference Management API is running!");
});

// --- API Routes ---
// Using both /api/auth and /auth to support both old and new frontend code
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes); // Add this route to match frontend requests
app.use("/api/speakers", speakerRoutes);
app.use("/speakers", speakerRoutes); // Add this route to match frontend requests
app.use("/api/bookings", bookingRoutes);
app.use("/bookings", bookingRoutes); // Add this route to match frontend requests
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes); // Add this route to match frontend requests

// --- Error Handling Middleware ---
// Basic error handler - logs error and sends generic message
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Function to check if database needs initialization
async function initializeDatabase() {
  try {
    // Check if database has any users
    const userCount = await prisma.profile.count();

    if (userCount === 0) {
      console.log("Database is empty, running seed script...");
      try {
        // Run the seed script
        const seedPath = path.join(__dirname, '../prisma/seed.ts');
        execSync(`npx ts-node ${seedPath}`, { stdio: 'inherit' });
        console.log("Database seeded successfully!");
      } catch (error) {
        console.error("Error running seed script:", error);
      }
    } else {
      console.log(`Database already contains ${userCount} users, skipping seed.`);
    }
  } catch (error) {
    console.error("Error checking database:", error);
    // If there's an error (like table doesn't exist), run migrations
    console.log("Running database migrations...");
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log("Migrations applied, now seeding...");
      const seedPath = path.join(__dirname, '../prisma/seed.ts');
      execSync(`npx ts-node ${seedPath}`, { stdio: 'inherit' });
    } catch (seedError) {
      console.error("Error during migration or seeding:", seedError);
    }
  }
}

// --- Server Startup ---
async function main() {
  console.log("Connecting to database...");
  await prisma.$connect();
  console.log("Database connected.");

  // Initialize database with seed data if needed
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

main().catch(async (e) => {
  console.error("Server startup failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});

// --- Graceful Shutdown ---
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  await prisma.$disconnect();
  console.log("Database connection closed.");
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

