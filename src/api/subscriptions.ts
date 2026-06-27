import client from './client';
import type { VerifyPaymentRequest } from '../types';

export async function getPlans() { return client.get('/subscriptions/plans'); }
export async function getMySubscription() { return client.get('/subscriptions/me'); }
export async function createOrder(plan_id: string) { return client.post('/subscriptions/order', { plan_id }); }
export async function verifyPayment(data: VerifyPaymentRequest) { return client.post('/subscriptions/verify', data); }
export async function cancelSubscription() { return client.post('/subscriptions/cancel'); }
