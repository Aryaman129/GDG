import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    // Demo mode is now disabled to use real authentication
    const DEMO_MODE = false;

    // Get token from localStorage (only in browser)
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('authData');
      if (authData) {
        try {
          const { session } = JSON.parse(authData);
          if (session && session.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
          }
        } catch (error) {
          console.error('Error parsing auth data from localStorage:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // For demo purposes, we'll just log the error
      console.log('Authentication error. Please log in again.');

      // In a production app, you might want to redirect to login
      // or refresh the token if you have a refresh token
      if (typeof window !== 'undefined') {
        // Clear auth data
        // localStorage.removeItem('authData');
        // window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data: { email: string; password: string; fullName: string; phone: string; role?: string }) =>
    api.post('/auth/signup', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// Speaker API
export const speakerAPI = {
  getAllSpeakers: () =>
    api.get('/speakers'),

  updateProfile: (data: { expertise?: string; price_per_hour?: number }) =>
    api.put('/speakers/me', data),

  getSpeakerSlots: (speakerId: string, date: string) =>
    api.get(`/speakers/slots/${speakerId}?date=${date}`),

  createSlot: (data: { session_date: string; hour: number }) =>
    api.post('/speakers/slots', data),
};

// Booking API
export const bookingAPI = {
  createBooking: (data: { slotId: number }) =>
    api.post('/bookings', data),

  getMyBookings: () =>
    api.get('/bookings/my'),

  getBookingQr: (bookingId: number) =>
    api.get(`/bookings/${bookingId}/qr`),
};

// Admin API
export const adminAPI = {
  checkIn: (data: { qrPayload: string }) =>
    api.post('/admin/checkin', data),

  getStats: () =>
    api.get('/admin/stats'),
};

export default api;
