import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

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
app.use(cors()); // Enable CORS for all origins (adjust for production if needed)
app.use(express.json()); // Middleware to parse JSON bodies

// --- Basic Routes ---
app.get("/", (req: Request, res: Response) => {
  res.send("Conference Management API is running!");
});

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/speakers", speakerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// --- Error Handling Middleware ---
// Basic error handler - logs error and sends generic message
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- Server Startup ---
async function main() {
  // Optional: Add any startup logic here
  console.log("Connecting to database...");
  await prisma.$connect();
  console.log("Database connected.");

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

