const QRCode = require('qrcode');

// Test QR code generation
async function testQRCodeGeneration() {
  try {
    // Sample booking data
    const bookingData = {
      bookingId: 123,
      userId: "user-123",
      speakerId: "speaker-456",
      date: "2025-05-01",
      hour: 10
    };

    // Convert to JSON string (this is what we store in the QR code)
    const qrPayload = JSON.stringify(bookingData);
    console.log('QR Payload:', qrPayload);

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(qrPayload);
    console.log('QR Code URL (truncated):', qrCodeUrl.substring(0, 50) + '...');

    // Generate QR code as terminal output (for visual verification)
    console.log('\nQR Code (terminal representation):');
    await QRCode.toString(qrPayload, { type: 'terminal' })
      .then(qrString => {
        console.log(qrString);
      });

    return true;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return false;
  }
}

// Run the test
testQRCodeGeneration()
  .then(success => {
    console.log('\nQR Code test completed with success =', success);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
  });
