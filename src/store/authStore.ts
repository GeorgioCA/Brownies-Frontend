import { create } from 'zustand';
import type { UserProfile } from '../types';
import * as authApi from '../api/auth';
import * as profileApi from '../api/profile';
import * as storage from '../utils/storage';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  profileComplete: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;

  sendOtp: (phone_number: string) => Promise<string>;
  verifyOtp: (phone_number: string, otp: string) => Promise<boolean>;
  setPassword: (password: string) => Promise<void>;
  login: (phone_number: string, password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  profileComplete: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  setTokens: (access: string, refresh: string) => {
    storage.setAccessToken(access);
    storage.setRefreshToken(refresh);
    set({ accessToken: access, refreshToken: refresh });
  },

  sendOtp: async (phone_number: string) => {
    const res = await authApi.sendOtp(phone_number);
    return res.data.otp;
  },

  verifyOtp: async (phone_number: string, otp: string) => {
    const res = await authApi.verifyOtp(phone_number, otp);
    const { access_token, refresh_token, profile_complete } = res.data;
    get().setTokens(access_token, refresh_token);
    set({ isAuthenticated: true, profileComplete: profile_complete });
    return profile_complete;
  },

  setPassword: async (password: string) => {
    await authApi.setPassword(password);
  },

  login: async (phone_number: string, password: string) => {
    const res = await authApi.login(phone_number, password);
    const { access_token, refresh_token } = res.data;
    get().setTokens(access_token, refresh_token);
    set({ isAuthenticated: true, profileComplete: true });
  },

  restoreSession: async () => {
    try {
      const accessToken = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();
      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken, isAuthenticated: true });
        await get().fetchProfile();
      }
    } catch {
      await storage.clearAll();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const res = await profileApi.getMyProfile();
      const user = res.data as UserProfile;
      set({ user, profileComplete: user.profile_complete });
    } catch {
      // profile fetch failed
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    await storage.clearAll();
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null, profileComplete: false });
  },

  deleteAccount: async () => {
    try { await authApi.deleteAccount(); } catch {}
    await storage.clearAll();
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null, profileComplete: false });
  },
}));
