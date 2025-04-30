# Conference Management System

## Project Overview

This project is a Conference Management System designed to facilitate the booking of sessions between users and speakers. It includes features for user authentication, speaker availability management, booking with QR code generation, Google Calendar integration, and an admin panel for check-ins and statistics. The system comprises a backend API and a frontend application.

This project was developed as part of the GDGoC SRM Recruitments 2025 Technical Tasks, merging requirements from the "Speaker Session Booking" and "QR-Based Event Check-In System" tasks, with additional enhancements like Google Calendar integration and a focus on a unique and impressive implementation leveraging AI tools.

## Demo Environment

**Important: This is a demo environment with the following characteristics:**

- The application is hosted on Render's free tier
- The database is automatically seeded with demo data on first startup
- New data created during your session (new speakers, bookings, etc.) will persist as long as:
  - The service doesn't go to sleep (after 15 minutes of inactivity)
  - No new deployments are made
  - No maintenance is performed by Render
- If you return to the demo after some time, your previously created data may still be available, but it's not guaranteed
- For the most reliable demo experience, use the pre-seeded demo accounts listed below

## Features

*   **User Authentication:** Secure user signup and login using email/password (via Supabase Auth) and OTP verification (via Twilio).
*   **Role-Based Access Control:** Distinct roles for Users, Speakers, and Admins with corresponding permissions.
*   **Speaker Profiles & Availability:** Speakers can manage their profiles (expertise, pricing) and define their available time slots.
*   **Session Booking:** Users can browse available speakers and book their time slots.
*   **QR Code Generation:** Unique QR codes are generated for each booking, intended for event check-in.
*   **Google Calendar Integration:** Attempts to automatically create a Google Calendar event in the speaker's calendar upon successful booking (requires speaker OAuth flow completion).
*   **Admin Dashboard:** Admins can check users in using QR codes and view booking statistics.
*   **Frontend Interface:** A user-friendly interface built with Next.js and Tailwind CSS for interacting with the system.

## Technologies Used

*   **Backend:**
    *   Runtime: Node.js
    *   Framework: Express.js
    *   Language: TypeScript
    *   ORM: Prisma
    *   Authentication: Supabase Auth, JWT
    *   SMS Verification: Twilio
    *   Calendar Integration: Google Calendar API (`googleapis`)
    *   QR Codes: `qrcode`
    *   Environment Variables: `dotenv`
*   **Frontend:**
    *   Framework: Next.js
    *   Language: TypeScript
    *   UI Library: React
    *   Styling: Tailwind CSS
    *   UI Components: Shadcn UI (implied, includes Button, DropdownMenu, etc.)
    *   State Management: Zustand (implied by `store.ts`)
    *   API Client: Axios (implied by `api.ts`)
*   **Database:** PostgreSQL (managed by Supabase)
*   **Development Tools:** npm/yarn, ESLint, Prettier

## Project Structure

```
conference-management/
├── backend/            # Node.js/Express backend API
│   ├── prisma/         # Prisma schema and migrations
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/     # (Implicitly defined by Prisma)
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts   # Main server entry point
│   ├── .env.example    # Example environment variables
│   ├── package.json
│   └── tsconfig.json
├── frontend/           # Next.js frontend application
│   ├── src/
│   │   ├── app/        # Next.js App Router pages
│   │   ├── components/ # Reusable React components
│   │   ├── lib/        # Utility functions (API client, state store)
│   │   └── styles/     # Global styles
│   ├── public/
│   ├── .env.local.example # Example environment variables
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
├── Screenshots/      # Screeshots of the application
└── README.md           # This file
```

## Setup Instructions

**Prerequisites:**

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Supabase Account (for database and authentication)
*   Twilio Account (for SMS OTP verification, requires SID, Auth Token, and a Twilio phone number)
*   Google Cloud Platform Project with OAuth 2.0 Credentials enabled (Client ID, Client Secret) for Google Calendar API.

**Backend Setup:**

1.  Navigate to the `backend` directory: `cd conference-management/backend`
2.  Install dependencies: `npm install` (or `yarn install`)
3.  Create a `.env` file by copying `.env.example` (if provided) or creating it manually. Populate it with your credentials:
    ```dotenv
    DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" # Your Supabase DB Connection String (Pooled)
    DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"   # Your Supabase DB Connection String (Direct)
    SUPABASE_URL="YOUR_SUPABASE_URL"
    SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    JWT_SECRET="YOUR_RANDOM_JWT_SECRET"
    TWILIO_ACCOUNT_SID="YOUR_TWILIO_ACCOUNT_SID"
    TWILIO_AUTH_TOKEN="YOUR_TWILIO_AUTH_TOKEN"
    TWILIO_PHONE_NUMBER="YOUR_TWILIO_PHONE_NUMBER"
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
    GOOGLE_REDIRECT_URI="http://localhost:PORT/auth/google/callback" # Or your deployed backend callback URL
    # Optional: Define a port or it defaults
    # PORT=3000
    ```
4.  Apply database migrations: `npx prisma migrate dev --name init`
5.  Generate Prisma client: `npx prisma generate`
6.  Start the development server: `npm run dev`

**Frontend Setup:**

1.  Navigate to the `frontend` directory: `cd ../frontend`
2.  Install dependencies: `npm install` (or `yarn install`)
3.  Create a `.env.local` file if needed to specify the backend API URL:
    ```dotenv
    NEXT_PUBLIC_API_URL=http://localhost:3000 # Or your backend server URL
    ```
4.  Start the development server: `npm run dev`
5.  Access the application at `http://localhost:3000` (or the specified port).


## Running the Application

You can run the application in two ways:

### Option 1: Using Docker

This is the easiest way to run the application and ensures consistent behavior across different environments:

1. Make sure you have Docker and Docker Compose installed on your system
2. Navigate to the project root directory
3. Run the following command:
   ```
   docker-compose up
   ```
4. Access the application at `http://localhost:3000`

### Option 2: Running Locally

If you prefer to run the application without Docker:

1. Start the backend server:
   ```
   cd conference-management/backend
   npm install
   npx prisma generate
   npm run dev
   ```

2. Start the frontend server:
   ```
   cd conference-management/frontend
   npm install
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Demo Users

The following demo users are available for testing:

- **Regular User**
  - Email: user@example.com
  - Password: password123
  - Role: Attendee who can book sessions with speakers

- **Speaker User**
  - Email: speaker@example.com
  - Password: password123
  - Role: Speaker who can set availability and view bookings

## Deployment Information

This application is deployed on Render's free tier, which has some limitations:

1. **Sleep Mode**: The service goes to sleep after 15 minutes of inactivity
2. **Cold Start**: The first request after inactivity may take 30-60 seconds to respond
3. **Data Persistence**: Data is stored in a SQLite database that persists between service restarts, but may be reset during deployments or maintenance

### How to Use the Demo

1. **Start with the pre-seeded accounts**: Log in using one of the demo accounts above
2. **Test the speaker flow**:
   - Log in as a speaker
   - View and manage your availability
   - Check your bookings
3. **Test the attendee flow**:
   - Log in as a regular user
   - Browse available speakers
   - Book a session
   - View your QR code for check-in

### Deploying Your Own Instance

To deploy this application to Render:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aryaman129/GDG.git
   cd GDG
   ```

2. **Deploy using the provided script**:
   ```bash
   # On Windows
   .\deploy.sh

   # On macOS/Linux
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Follow the Blueprint deployment process on Render**:
   - Log in to your Render account
   - Create a new Blueprint
   - Select your repository
   - Apply the configuration

For detailed deployment instructions, see the [DEPLOYMENT.md](./DEPLOYMENT.md) file.

### Source Code

The complete source code for this project is available on GitHub:
[https://github.com/Aryaman129/GDG](https://github.com/Aryaman129/GDG)
