import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://localhost:8000/api/v1';
  }
  return '/api/v1';
};

export const BASE_URL = getBaseUrl();

export const getWsUrl = (): string => {
  if (BASE_URL.startsWith('http')) {
    return BASE_URL.replace(/^http/, 'ws') + '/ws';
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}${BASE_URL}/ws`;
  }
  return `ws://localhost${BASE_URL}/ws`;
};

export const MAX_PHOTOS = 6;
export const MAX_VOICE_PROMPT_SECONDS = 60;
export const FREE_LIKES_PER_DAY = 50;
export const FREE_SUPER_LIKES_PER_DAY = 1;
export const MIN_PASSWORD_LENGTH = 6;
export const PAGE_SIZE = 20;

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
] as const;

export const INTENT_OPTIONS = [
  { label: "Let's See", value: 'lets_see' },
  { label: 'Serious Relationship', value: 'serious_relationship' },
  { label: 'Casual', value: 'casual' },
  { label: 'Friendship', value: 'friendship' },
  { label: 'Marriage', value: 'marriage' },
] as const;

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
] as const;

export const REPORT_REASONS = [
  'Inappropriate Behavior',
  'Fake Profile',
  'Harassment',
  'Spam',
  'Underage User',
  'Other',
] as const;
