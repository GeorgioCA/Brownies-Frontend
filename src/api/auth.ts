import client from './client';

export async function sendOtp(phone_number: string) { return client.post('/auth/send-otp', { phone_number }); }
export async function verifyOtp(phone_number: string, otp: string) { return client.post('/auth/verify-otp', { phone_number, otp }); }
export async function setPassword(password: string) { return client.post('/auth/set-password', { password }); }
export async function login(phone_number: string, password: string) { return client.post('/auth/login', { phone_number, password }); }
export async function refreshToken(refresh_token: string) { return client.post('/auth/refresh', { refresh_token }); }
export async function logout() { return client.post('/auth/logout'); }
export async function deleteAccount() { return client.delete('/auth/account'); }
