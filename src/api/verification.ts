import client from './client';

export async function getVerificationStatus() { return client.get('/verification/status'); }
export async function sendPhoneVerifyOtp() { return client.post('/verification/phone/send-otp'); }
export async function verifyPhone(otp: string) { return client.post('/verification/phone/verify', { otp }); }
export async function uploadVerificationPhoto(file: { uri: string; name: string; type: string }) {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  return client.post('/verification/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
}
