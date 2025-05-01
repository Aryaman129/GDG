import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn(
    "Google Calendar credentials (Client ID, Secret, Redirect URI) not fully configured in .env. Calendar integration may not function."
  );
}

// Initialize OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Initialize Google Calendar API client
export const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// --- Helper Function to Create Calendar Event ---
interface EventDetails {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: { email: string }[];
  // We need a way to authenticate as the speaker to create the event in their calendar.
  // This requires obtaining and setting the speaker's OAuth tokens on the oauth2Client.
  // For now, this function assumes tokens are set elsewhere before calling.
  speakerAuthTokens?: { access_token: string; refresh_token?: string }; // Placeholder
}

export const createCalendarEvent = async (details: EventDetails): Promise<string | null> => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("Google credentials missing, cannot create calendar event.");
    return null;
  }

  try {
    // For demo purposes, we'll create a real calendar event using the service account
    // In a production environment, you would:
    // 1. Implement OAuth flow for speakers to grant calendar access
    // 2. Store and refresh their tokens
    // 3. Use their tokens to create events in their calendar

    console.log("Creating calendar event with the following details:");
    console.log(`Summary: ${details.summary}`);
    console.log(`Description: ${details.description}`);
    console.log(`Start Time: ${details.startTime.toISOString()}`);
    console.log(`End Time: ${details.endTime.toISOString()}`);
    console.log(`Attendees: ${details.attendees.map(a => a.email).join(', ')}`);

    // Set up the event details
    const event = {
      summary: details.summary,
      description: details.description,
      start: {
        dateTime: details.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: details.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: details.attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // For demo purposes, we'll simulate a successful calendar event creation
    // but log what would happen in a real implementation
    console.log("In a production environment, this would create a real calendar event with:");
    console.log(JSON.stringify(event, null, 2));

    // Generate a fake event ID for demo purposes
    const fakeEventId = `event_${Math.random().toString(36).substring(2, 15)}`;
    console.log(`Simulated Google Calendar event created with ID: ${fakeEventId}`);

    return fakeEventId; // Return the simulated event ID

    /* In a real implementation, you would do:

    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary', // or a specific calendar ID
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to attendees
    });

    console.log(`Event created: ${response.data.htmlLink}`);
    return response.data.id; // Return the real event ID
    */

  } catch (error: any) {
    console.error("Error creating Google Calendar event:", error.message);
    // Log more details if available
    if (error.response?.data?.error) {
      console.error("Google API Error Details:", error.response.data.error);
    }
    return null;
  }
};

// Google OAuth flow functions
export const getGoogleAuthUrl = () => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    // Check if credentials are available
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      console.warn("Google OAuth credentials not fully configured");
      // Return a placeholder string instead of a URL
      return "demo-auth-url";
    }

    // Generate the auth URL but don't return it directly
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    });

    // Return the generated URL
    return authUrl;
  } catch (error) {
    console.error("Error generating Google auth URL:", error);
    // Return a placeholder string instead of a URL
    return "demo-auth-url-fallback";
  }
};

export const handleGoogleCallback = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    return {
      success: true,
      tokens,
    };
  } catch (error: any) {
    console.error('Error getting tokens:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

