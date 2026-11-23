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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('cybersentinel_token'),
  isAuthenticated: !!localStorage.getItem('cybersentinel_token'),
  isLoading: true,

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
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }
}));
