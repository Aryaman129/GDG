# Conference Management System

A comprehensive web application for managing conference speaker sessions with booking and QR code-based check-in functionality.

## Live Demo

The application is deployed and available at:
- **Frontend**: [https://conference-management-frontend-lzow.onrender.com](https://conference-management-frontend-lzow.onrender.com)
- **Backend API**: [https://conference-management-backend-pw62.onrender.com](https://conference-management-backend-pw62.onrender.com)

## Project Overview

The Conference Management System is a full-stack web application that facilitates booking and managing speaker sessions at conferences. It allows:

- **Attendees** to browse speakers, book sessions, and receive QR codes for check-in
- **Speakers** to manage their profiles, availability, and view their bookings
- **Admins** to check in attendees using QR codes and view statistics

## Key Features

### Authentication System
- User Types: Attendees, Speakers, and Admins
- Registration Flow: Email/password signup with OTP verification
- Login: Email/password authentication
- JWT Tokens: Secure API access with token-based authentication
- Demo Mode: Special authentication bypass for demonstration purposes

### Speaker Management
- Speaker Profiles: Expertise, bio, and pricing information
- Availability Management: Speakers can create time slots for bookings
- Booking Overview: Speakers can view all their booked sessions
- Income Tracking: Speakers can view earnings based on bookings

### Booking System
- Session Discovery: Browse available speakers and their time slots
- Booking Process: Select a slot and complete booking
- Payment Simulation: Demo payment flow (no actual payment processing)
- QR Code Generation: Unique QR code for each booking for check-in

### Check-in System
- QR Code Scanning: Admin interface for scanning attendee QR codes
- Verification: Validates booking details and marks attendance
- Real-time Updates: Instant status updates for checked-in attendees

### Admin Dashboard
- Statistics: Overview of bookings, check-ins, and popular speakers
- User Management: View and manage user accounts
- Manual Check-in: Option for manual check-in if QR code is unavailable

## System Architecture

### Frontend
- **Framework**: Next.js (React framework)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with a custom UI component library
- **State Management**: Zustand for global state (authentication)
- **Animation**: Framer Motion for smooth transitions
- **HTTP Client**: Axios for API requests
- **Date Handling**: date-fns for date manipulation
- **Notifications**: Sonner for toast notifications

### Backend
- **Framework**: Express.js (Node.js framework)
- **Language**: TypeScript
- **Database ORM**: Prisma (for database operations)
- **Database**: SQLite (local development)
- **Authentication**: JWT (JSON Web Tokens)
- **QR Code Generation**: qrcode library

## Project Structure

```
conference-management/
├── backend/            # Node.js/Express backend API
│   ├── prisma/         # Prisma schema and migrations
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts   # Main server entry point
│   └── package.json
├── frontend/           # Next.js frontend application
│   ├── src/
│   │   ├── app/        # Next.js App Router pages
│   │   ├── components/ # Reusable React components
│   │   ├── lib/        # Utility functions (API client, state store)
│   │   └── styles/     # Global styles
│   └── package.json
└── README.md
```
## Usage Guide

### For Attendees (User Role)

1. **Login/Registration**:
   - Sign up for a new account or use the demo credentials: `user@example.com / password123`
   - During registration, you'll need to verify your email with an OTP (in demo mode, any code works)
   - After login, you'll be redirected to the user dashboard

2. **Browsing Speakers**:
   - From the dashboard, you can view all available speakers
   - Each speaker card shows their expertise, bio, and hourly rate
   - Click on a speaker to view their detailed profile and available time slots

3. **Booking a Session**:
   - On the speaker's profile page, select a date to view available time slots
   - Click on an available slot to book it
   - Confirm your booking in the modal that appears
   - A simulated payment process will be shown (no actual payment is processed)

4. **Managing Bookings**:
   - View all your bookings in the "My Bookings" section of the dashboard
   - Each booking shows the speaker name, date, time, and status (upcoming/past)
   - Click on a booking to view its details and access the QR code for check-in

5. **QR Code for Check-in**:
   - Each booking has a unique QR code that contains booking information
   - This QR code is used by admins to check you in at the conference
   - You can access your QR code from the booking details page

### For Speakers (Speaker Role)

1. **Login/Registration**:
   - Sign up as a speaker or use the demo credentials: `speaker@example.com / password123`
   - After login, you'll be redirected to the speaker dashboard

2. **Managing Your Profile**:
   - Update your expertise, bio, and hourly rate from the dashboard
   - These details are visible to attendees when they browse speakers

3. **Creating Availability Slots**:
   - Go to the "Manage Slots" section of your dashboard
   - Select a date and time to create a new availability slot
   - You can create multiple slots for different dates and times

4. **Viewing Bookings**:
   - The dashboard shows all bookings made for your sessions
   - You can see attendee details, booking dates, and check-in status
   - Filter bookings by date or status (upcoming/past)

5. **Income Tracking**:
   - The dashboard displays your total earnings based on booked sessions
   - Earnings are calculated using your hourly rate and the number of booked sessions
   - View detailed breakdowns by date or attendee

### For Admins (Admin Role)

1. **Login and Access**:
   - Use the admin credentials: `admin@example.com / password123`
   - After login, you'll be redirected to the admin dashboard
   - You can also access the admin dashboard directly at:
     - Local: http://localhost:3000/admin/dashboard
     - Deployed: https://conference-management-frontend-lzow.onrender.com/admin/dashboard
   - The system will check if you have admin privileges before allowing access

2. **Check-in System**:
   - The default tab in the admin dashboard is the "Check-in" tab
   - To check in an attendee:
     1. Ask the attendee to show their booking QR code
     2. Copy the QR code data (JSON string) into the input field
     3. Click "Check In" to process the check-in
     4. The system will verify the booking and mark the attendee as checked in
     5. A success message will be displayed with the attendee and session details

3. **Viewing Statistics**:
   - Click on the "Statistics" tab in the admin dashboard
   - View key metrics:
     - Total number of bookings in the system
     - Number of attendees who have checked in
     - Check-in rate (percentage of bookings that have been checked in)
     - Top speakers by number of bookings
   - The statistics update in real-time as attendees are checked in

4. **Troubleshooting Check-ins**:
   - If a QR code is damaged or cannot be scanned:
     1. Ask the attendee for their booking details (name, speaker, date, time)
     2. Use these details to manually find and check in the booking
   - If an attendee has already been checked in, the system will show a notification

## Demo Credentials

For testing purposes, you can use the following credentials:

### Main Demo Accounts

- **Attendee**: user@example.com / password123
- **Speaker**: speaker@example.com / password123
- **Admin**: admin@example.com / password123

### Demo Mode

The application includes a demo mode that can be enabled by setting the `DEMO_MODE=true` environment variable. When demo mode is active:

1. **Authentication Bypass**:
   - The system automatically assigns appropriate user roles based on the URL path
   - For admin endpoints: Uses admin role
   - For speaker endpoints: Uses demo-speaker-id (demo-speaker@example.com)
   - For regular user endpoints: Uses demo-user-id (demo@example.com)

2. **Role Authorization**:
   - Role checks are bypassed in demo mode
   - This allows testing of protected endpoints without valid JWT tokens

3. **OTP Verification**:
   - Any OTP code is accepted during registration
   - All demo accounts are pre-verified

This feature is useful for demonstration and testing purposes but should be disabled in production environments.

## Deployment

### Current Deployment

The application is currently deployed on Render:

- **Frontend**: [https://conference-management-frontend-lzow.onrender.com](https://conference-management-frontend-lzow.onrender.com)
- **Backend API**: [https://conference-management-backend-pw62.onrender.com](https://conference-management-backend-pw62.onrender.com)

### Deployment Notes

1. **Render Deployment**:
   - The application is deployed using Render's free tier
   - Free tier limitations:
     - Services spin down after periods of inactivity
     - First request after inactivity may take up to 30 seconds to respond
     - SQLite database is stored in a non-persistent disk, so data may reset periodically
   - The `render.yaml` file in the repository configures both services

2. **Database Considerations**:
   - The demo deployment uses SQLite for simplicity
   - Demo data is seeded on each deployment
   - For production use, consider migrating to PostgreSQL or another persistent database

3. **Alternative Deployment Options**:
   - **Vercel**: Excellent for hosting the Next.js frontend
   - **Railway/Fly.io**: Good alternatives for hosting the Express backend
   - **Docker**: For containerized deployment of both frontend and backend

## Technical Implementation Details

### Database Schema
- **Profile**: User information (id, email, full_name, role)
- **SpeakerProfile**: Speaker-specific details (expertise, bio, price_per_hour)
- **SessionSlot**: Available time slots (speaker_id, date, hour, is_booked)
- **Booking**: Session bookings (user_id, slot_id, qr_code_url, checked_in)

### Authentication Flow
1. User registers with email/password
2. System sends OTP for verification (simulated in demo)
3. User verifies account with OTP
4. System generates JWT token for authenticated API access
5. Token is stored in localStorage and included in API requests

## QR Code System Explained

The QR code system is a key feature of the Conference Management System:

1. **QR Code Generation**:
   - When an attendee books a session, the system generates a unique QR code
   - The QR code contains a JSON payload with booking details:
     ```json
     {
       "bookingId": 123,
       "userId": "user-uuid",
       "speakerId": "speaker-uuid",
       "date": "2023-06-15",
       "hour": 14
     }
     ```
   - This payload is encoded as a QR code image that the attendee can access from their booking details

2. **Check-in Process**:
   - At the conference, admins use the admin dashboard to check in attendees
   - The admin asks the attendee to show their QR code
   - The admin copies the QR code data (JSON string) into the check-in form
   - When submitted, the backend:
     1. Parses the JSON payload
     2. Verifies the booking exists in the database
     3. Checks if the booking has already been checked in
     4. If valid, marks the booking as checked in
     5. Returns confirmation with attendee and session details

3. **Security Considerations**:
   - The QR code contains only the necessary information for check-in
   - The backend validates all data before processing the check-in
   - In a production environment, additional security measures would be implemented

## Known Limitations and Demo Mode Features

1. **Authentication**:
   - OTP verification accepts any code in demo mode
   - JWT tokens have extended expiration times for demo purposes
   - Demo mode can be enabled to bypass authentication for testing

2. **Database**:
   - SQLite is used for simplicity (can be migrated to PostgreSQL for production)
   - On Render's free tier, the database may reset periodically due to non-persistent storage
   - Demo data is seeded on each deployment to ensure the application is always usable

3. **Simulated Features**:
   - Payment processing is simulated (no actual payments are processed)
   - Email notifications are logged to the console instead of being sent
   - Google Calendar integration is available but requires configuration of OAuth credentials

4. **Render Deployment Limitations**:
   - Services may spin down after periods of inactivity
   - First request after inactivity may take up to 30 seconds to respond
   - Limited resources may affect performance under heavy load

## Troubleshooting Common Issues

### Authentication Issues

1. **"403 Forbidden" or "Unauthorized" Errors**:
   - JWT token may have expired - try logging out and logging back in
   - In the deployed version, tokens expire after 24 hours
   - If using the demo mode, make sure the DEMO_MODE environment variable is set to "true"

2. **Login Not Working**:
   - Verify you're using the correct credentials
   - Check that the backend API is running and accessible
   - Clear browser cache and cookies, then try again

### Deployment Issues

1. **Slow Initial Load**:
   - On Render's free tier, services spin down after periods of inactivity
   - The first request may take up to 30 seconds while the service starts up
   - Subsequent requests will be much faster

2. **Data Reset or Missing**:
   - On Render's free tier, the SQLite database is stored on a non-persistent disk
   - Data may reset periodically when the service is redeployed
   - Demo data is seeded on each deployment to ensure basic functionality

### Frontend Issues

1. **UI Not Updating After Actions**:
   - Some actions may require a page refresh to show updated data
   - Try refreshing the page or navigating away and back
   - Check browser console for any JavaScript errors

2. **Dark Mode Text Visibility**:
   - Some text may have visibility issues in dark mode
   - Toggle to light mode if you encounter readability problems

### Backend Issues

1. **Database Connection Errors**:
   - Verify that the database file exists and is accessible
   - Check that Prisma is properly configured
   - Run `npx prisma generate` to regenerate the Prisma client

2. **Google Calendar Integration**:
   - Google Calendar integration requires OAuth credentials
   - Without proper configuration, this feature will be in demo mode
   - Check the .env file for Google OAuth configuration

## License

This project is for demonstration purposes only.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Framer Motion](https://www.framer.com/motion/)
- [QR Code](https://www.npmjs.com/package/qrcode)
- [JWT](https://www.npmjs.com/package/jsonwebtoken)
- [Render](https://render.com/) for hosting the application

-
## Setup Instructions 

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Option 1: Running Locally

#### Backend Setup

1. Navigate to the backend directory:
   ```
   cd conference-management/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Generate Prisma client:
   ```
   npx prisma generate
   ```

4. Start the development server:
   ```
   npm run dev
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd conference-management/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

### Option 2: Using Docker

1. Make sure you have Docker and Docker Compose installed
2. Run the following command in the project root:
   ```
   docker-compose up
   ```
3. Access the application at `http://localhost:3000`
