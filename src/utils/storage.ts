import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'brownies_access_token';
const REFRESH_TOKEN_KEY = 'brownies_refresh_token';
const USER_KEY = 'brownies_user';

const isWeb = Platform.OS === 'web';

const webStore = {
  getItem(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch {}
  },
  deleteItem(key: string): void {
    try { localStorage.removeItem(key); } catch {}
  },
};

export async function getAccessToken(): Promise<string | null> {
  if (isWeb) return webStore.getItem(ACCESS_TOKEN_KEY);
  try { return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY); } catch { return null; }
}

export async function setAccessToken(token: string): Promise<void> {
  if (isWeb) { webStore.setItem(ACCESS_TOKEN_KEY, token); return; }
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) return webStore.getItem(REFRESH_TOKEN_KEY);
  try { return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY); } catch { return null; }
}

export async function setRefreshToken(token: string): Promise<void> {
  if (isWeb) { webStore.setItem(REFRESH_TOKEN_KEY, token); return; }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  if (isWeb) { webStore.deleteItem(ACCESS_TOKEN_KEY); webStore.deleteItem(REFRESH_TOKEN_KEY); return; }
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function getStoredUser(): Promise<string | null> {
  if (isWeb) return webStore.getItem(USER_KEY);
  try { return await SecureStore.getItemAsync(USER_KEY); } catch { return null; }
}

export async function setStoredUser(user: string): Promise<void> {
  if (isWeb) { webStore.setItem(USER_KEY, user); return; }
  await SecureStore.setItemAsync(USER_KEY, user);
}

export async function clearAll(): Promise<void> {
  await clearTokens();
  if (isWeb) { webStore.deleteItem(USER_KEY); return; }
  await SecureStore.deleteItemAsync(USER_KEY);
}
