// ─── Auth ───
export interface SendOtpRequest {
  phone_number: string;
}

export interface SendOtpResponse {
  success: boolean;
  otp: string;
  expires_in_seconds: number;
}

export interface VerifyOtpRequest {
  phone_number: string;
  otp: string;
}

export interface VerifyOtpResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  profile_complete: boolean;
}

export interface SetPasswordRequest {
  password: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

// ─── Profile ───
export interface ProfileSetupRequest {
  name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  intent: 'lets_see' | 'serious_relationship' | 'casual' | 'friendship' | 'marriage';
  city: string;
  bio?: string;
  college?: string;
  workplace?: string;
  height_cm?: number;
  religion?: string;
  education?: string;
  occupation?: string;
  languages: string[];
  preferred_language: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  bio?: string;
  intent?: string;
  city?: string;
  college?: string;
  workplace?: string;
  height_cm?: number;
  religion?: string;
  education?: string;
  occupation?: string;
  preferred_language?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface Photo {
  id: number;
  photo_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Language {
  language: string;
}

export interface VoicePrompt {
  id: number;
  prompt_question: string;
  audio_url: string;
  duration_seconds: number;
}

export interface UserProfile {
  id: number;
  name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  bio: string | null;
  intent: string;
  city: string;
  college: string | null;
  workplace: string | null;
  height_cm: number | null;
  religion: string | null;
  education: string | null;
  occupation: string | null;
  phone_verified: boolean;
  photo_verified: boolean;
  profile_complete: boolean;
  is_premium: boolean;
  preferred_language: string;
  show_online_status: boolean;
  last_active: string;
  photos: Photo[];
  languages: Language[];
  voice_prompts: VoicePrompt[];
  created_at: string;
}

// ─── Discovery ───
export interface DiscoveryProfile extends UserProfile {
  age: number;
  distance_km: number | null;
}

export interface SwipeRequest {
  swiped_id: number;
  direction: 'like' | 'super_like' | 'pass';
}

export interface SwipeResponse {
  is_match: boolean;
  match_id: number | null;
}

export interface SwipeStats {
  likes_remaining: number;
  super_likes_remaining: number;
}

// ─── Matches ───
export interface MatchUser {
  id: number;
  name: string;
  age: number;
  gender: string;
  city: string;
  intent: string;
  photo_verified: boolean;
}

export interface Match {
  id: number;
  matched_at: string;
  is_active: boolean;
  user: MatchUser;
}

// ─── Messages ───
export interface Message {
  id: number;
  match_id: number;
  sender_id: number;
  message_type: 'text' | 'image';
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface SendMessageRequest {
  message_type: 'text';
  content: string;
}

export interface WomenFirstStatus {
  can_send: boolean;
  reason: string;
}

// ─── Notifications ───
export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}

// ─── Preferences ───
export interface Preferences {
  min_age: number;
  max_age: number;
  preferred_gender: 'male' | 'female' | 'both';
  max_distance_km: number;
  intent_filter: string | null;
  city_filter: string | null;
}

export interface NotificationSettingsRequest {
  show_online_status: boolean;
  show_distance: boolean;
}

// ─── Reports & Blocks ───
export interface ReportRequest {
  reported_id: number;
  reason: string;
}

export interface BlockRequest {
  blocked_id: number;
}

export interface BlockedUser {
  id: number;
  blocked_id: number;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
}

// ─── Verification ───
export interface VerificationStatus {
  phone_verified: boolean;
  photo_verified: boolean;
}

// ─── Subscriptions ───
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
}

export interface Subscription {
  id: number;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
}

export interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ─── Family Share ───
export interface FamilyShare {
  id: number;
  match_id: number;
  token: string;
  created_at: string;
  expires_at: string;
}

export interface SharedProfile {
  name: string;
  age: number;
  gender: string;
  city: string;
  intent: string;
  bio: string | null;
  photos: Photo[];
  voice_prompts: VoicePrompt[];
}

// ─── WebSocket ───
export interface WsAuthMessage {
  token: string;
}

export interface WsPingMessage {
  type: 'ping';
}

export interface WsTypingMessage {
  type: 'typing_start' | 'typing_stop';
  data: { match_id: number };
}

export interface WsServerMessage {
  type: 'pong' | 'new_message' | 'new_match' | string;
  data: Record<string, unknown>;
}

// ─── Navigation ───
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  PhoneInput: undefined;
  OtpVerify: { phone_number: string };
  SetPassword: { access_token: string };
  Login: undefined;
};

export type MainTabParamList = {
  DiscoverTab: undefined;
  ChatsTab: undefined;
  ProfileTab: undefined;
};

export type DiscoverStackParamList = {
  Discovery: undefined;
  ProfileDetail: { user_id: number };
};

export type ChatsStackParamList = {
  ChatList: undefined;
  ChatDetail: { match_id: number; other_user_name: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  EditProfile: undefined;
  Preferences: undefined;
  NotificationSettings: undefined;
  Premium: undefined;
  Settings: undefined;
  ViewProfile: { user_id: number };
};

export type OnboardingStackParamList = {
  StepBasic: undefined;
  StepGenderIntent: undefined;
  StepCity: undefined;
  StepOptional: undefined;
  StepPhotos: undefined;
};
