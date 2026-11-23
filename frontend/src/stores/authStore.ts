import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

// Canonical Lead SOC Architect account (Zero-barrier demonstration access)
const DEFAULT_DEMO_USER: User = {
  id: 'usr-mani02-admin',
  username: 'mani02',
  email: 'karuppasamy.selvi02@gmail.com',
  full_name: 'Lead SOC Architect',
  role: 'Administrator',
  is_active: true,
  created_at: new Date().toISOString()
};

const DEFAULT_DEMO_TOKEN = 'demo-session-token-cyberblack-mani02';

export const useAuthStore = create<AuthState>((set) => ({
  user: DEFAULT_DEMO_USER,
  token: localStorage.getItem('cybersentinel_token') || DEFAULT_DEMO_TOKEN,
  isAuthenticated: true,
  isLoading: false,

  setAuth: (user, token) => {
    localStorage.setItem('cybersentinel_token', token);
    localStorage.setItem('cybersentinel_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('cybersentinel_token');
    localStorage.removeItem('cybersentinel_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initAuth: () => {
    const token = localStorage.getItem('cybersentinel_token');
    const storedUser = localStorage.getItem('cybersentinel_user');
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      } catch (e) {
        localStorage.removeItem('cybersentinel_token');
        localStorage.removeItem('cybersentinel_user');
      }
    }
    // Default to authorized Lead SOC Architect for seamless demonstration
    set({ user: DEFAULT_DEMO_USER, token: DEFAULT_DEMO_TOKEN, isAuthenticated: true, isLoading: false });
  }
}));
