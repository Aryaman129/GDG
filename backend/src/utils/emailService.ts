import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

// Initialize SendGrid if API key is available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@conferenceapp.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('SendGrid initialized successfully.');
} else {
  console.warn('SendGrid API key not found. Email functionality will be simulated.');
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Send an email using SendGrid or simulate it if in demo mode
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For demo purposes, just log the email content
    console.log('DEMO MODE: Email would be sent with the following details:');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Text: ${options.text.substring(0, 100)}...`);
    
    // If SendGrid is configured, actually send the email
    if (SENDGRID_API_KEY) {
      const msg = {
        to: options.to,
        from: FROM_EMAIL,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      };
      
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${options.to}`);
    } else {
      console.log('DEMO MODE: Email sending simulated (no SendGrid API key)');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a booking confirmation email with QR code
 */
export async function sendBookingConfirmationEmail(
  userEmail: string,
  userName: string,
  speakerName: string,
  sessionDate: Date,
  sessionHour: number,
  qrCodeUrl: string
): Promise<boolean> {
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const subject = `Booking Confirmation: Session with ${speakerName}`;
  
  // Extract the base64 data from the data URL
  const qrCodeBase64 = qrCodeUrl.split(',')[1];
  
  const text = `
    Hello ${userName},
    
    Your session with ${speakerName} has been confirmed for ${formattedDate} at ${sessionHour}:00.
    
    Please find attached your QR code for check-in.
    
    Thank you for using our Conference Management System!
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmation</h2>
      <p>Hello ${userName},</p>
      <p>Your session with <strong>${speakerName}</strong> has been confirmed for:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionHour}:00</p>
      </div>
      <p>Please find attached your QR code for check-in.</p>
      <div style="text-align: center; margin: 30px 0;">
        <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px;" />
      </div>
      <p>Thank you for using our Conference Management System!</p>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    text,
    html,
    attachments: [
      {
        content: qrCodeBase64,
        filename: 'qr-code.png',
        type: 'image/png',
        disposition: 'attachment'
      }
    ]
  });
}
