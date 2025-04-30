import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define types for our state
interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'SPEAKER' | 'ADMIN';
}

interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: any;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, session: Session) => void;
  logout: () => void;
}

// Create store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: (user, session) => {
        // Also store in localStorage for API interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('authData', JSON.stringify({ user, session }));
        }

        set({
          user,
          session,
          isAuthenticated: true,
          error: null
        });
      },

      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authData');
        }

        set({
          user: null,
          session: null,
          isAuthenticated: false,
          error: null
        });
      },
    }),
    {
      name: 'auth-storage', // name of the item in storage
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      }), // only persist these fields
    }
  )
);
