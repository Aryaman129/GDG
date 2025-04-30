const fetch = require('node-fetch');

// Test the check-in process
async function testCheckIn() {
  try {
    // 1. Login as admin to get token
    console.log('Logging in as admin...');
    const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${JSON.stringify(errorData)}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.session.access_token;
    console.log('Login successful, token received');

    // 2. Create a sample QR payload (this would normally come from scanning a QR code)
    const qrPayload = JSON.stringify({
      bookingId: 1, // This should be a valid booking ID in your database
      userId: "191c241d-2c6f-4b4d-9f19-ac00955f81b1", // This should be a valid user ID
      speakerId: "1336b9db-9c7f-41da-92c1-cd954ee71a03", // This should be a valid speaker ID
      date: "2025-04-29",
      hour: 10
    });

    // 3. Send check-in request
    console.log('Sending check-in request...');
    const checkinResponse = await fetch('http://localhost:8000/api/admin/checkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        qrPayload
      })
    });

    const checkinData = await checkinResponse.json();
    
    if (!checkinResponse.ok) {
      throw new Error(`Check-in failed: ${JSON.stringify(checkinData)}`);
    }

    console.log('Check-in response:', checkinData);
    return true;
  } catch (error) {
    console.error('Error during check-in test:', error);
    return false;
  }
}

// Run the test
testCheckIn()
  .then(success => {
    console.log('\nCheck-in test completed with success =', success);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
