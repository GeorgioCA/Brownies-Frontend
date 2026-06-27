import client from './client';
import type { ProfileSetupRequest, ProfileUpdateRequest } from '../types';

export async function setupProfile(data: ProfileSetupRequest) { return client.post('/profile/setup', data); }
export async function getMyProfile() { return client.get('/profile/me'); }
export async function updateProfile(data: ProfileUpdateRequest) { return client.patch('/profile/me', data); }
export async function getUserProfile(user_id: number) { return client.get(`/profile/${user_id}`); }
export async function uploadPhoto(file: { uri: string; name: string; type: string }) {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  return client.post('/profile/photos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}
export async function deletePhoto(photo_id: number) { return client.delete(`/profile/photos/${photo_id}`); }
export async function reorderPhotos(photo_ids: number[]) { return client.put('/profile/photos/reorder', { photo_ids }); }
export async function getVoicePrompts() { return client.get('/profile/voice-prompts'); }
export async function uploadVoicePrompt(file: { uri: string; name: string; type: string }, prompt_question: string, duration_seconds: number) {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  form.append('prompt_question', prompt_question);
  form.append('duration_seconds', String(duration_seconds));
  return client.post('/profile/voice-prompts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}
export async function deleteVoicePrompt(id: number) { return client.delete(`/profile/voice-prompts/${id}`); }
export async function updateLanguages(languages: string[]) { return client.put('/profile/languages', { languages }); }
