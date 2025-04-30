// Using global fetch API

const API_URL = 'http://localhost:8000/api';

interface Speaker {
  id: string;
  fullName: string;
  email: string;
  expertise: string;
  bio: string;
  pricePerHour: number;
  avatarUrl: string | null;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  session: {
    access_token: string;
  };
}

interface Booking {
  id: number;
  slot: {
    session_date: string;
    hour: number;
    speaker: {
      profile: {
        full_name: string;
      };
    };
  };
  checked_in: boolean;
}

interface Slot {
  id: number;
  session_date: string;
  hour: number;
}

async function testAPI() {
  try {
    console.log('Testing API endpoints...');

    // Test speakers endpoint
    console.log('\n1. Testing GET /speakers');
    const speakersResponse = await fetch(`${API_URL}/speakers`);
    const speakersData = await speakersResponse.json() as Speaker[];
    console.log(`Status: ${speakersResponse.status}`);
    console.log(`Number of speakers: ${speakersData.length}`);

    // Test login endpoint
    console.log('\n2. Testing POST /auth/login');
    try {
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123'
        })
      });

      const loginData = await loginResponse.json() as LoginResponse;
      console.log(`Status: ${loginResponse.status}`);
      console.log('Login successful');

      if (loginData.session && loginData.session.access_token) {
        const token = loginData.session.access_token;

        // Test bookings endpoint with authentication
        console.log('\n3. Testing GET /bookings/my with authentication');
        const bookingsResponse = await fetch(`${API_URL}/bookings/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const bookingsData = await bookingsResponse.json() as Booking[];
        console.log(`Status: ${bookingsResponse.status}`);
        console.log(`Number of bookings: ${bookingsData.length}`);

        // Test speaker slots endpoint
        if (speakersData.length > 0) {
          const speakerId = speakersData[0].id;
          console.log(`\n4. Testing GET /speakers/slots/${speakerId}?date=2025-05-01`);
          const slotsResponse = await fetch(`${API_URL}/speakers/slots/${speakerId}?date=2025-05-01`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          try {
            const slotsData = await slotsResponse.json();
            console.log(`Status: ${slotsResponse.status}`);
            if (Array.isArray(slotsData)) {
              console.log(`Number of slots: ${slotsData.length}`);
            } else {
              console.log('Response:', slotsData);
            }
          } catch (error) {
            console.error('Error parsing slots response:', error);
          }
        }
      }
    } catch (loginError: any) {
      console.error('Login failed:', loginError.message);
    }

  } catch (error: any) {
    console.error('API test failed:', error.message);
  }
}

testAPI();
