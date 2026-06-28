import { Platform } from 'react-native';
import client from './client';

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

export async function getVerificationStatus() { return client.get('/verification/status'); }
export async function sendPhoneVerifyOtp() { return client.post('/verification/phone/send-otp'); }
export async function verifyPhone(otp: string) { return client.post('/verification/phone/verify', { otp }); }
export async function uploadVerificationPhoto(file: { uri: string; name: string; type: string }) {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await uriToBlob(file.uri);
    form.append('file', blob, file.name);
  } else {
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  }
  return client.post('/verification/photo', form);
}
