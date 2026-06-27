import client from './client';
import type { SwipeRequest } from '../types';

export async function getDiscovery(page: number = 1, per_page: number = 20) { return client.get(`/discovery/discovery?page=${page}&per_page=${per_page}`); }
export async function swipe(data: SwipeRequest) { return client.post('/discovery/swipes', data); }
export async function undoLastSwipe() { return client.post('/discovery/swipes/undo'); }
export async function getSwipeStats() { return client.get('/discovery/swipes/stats'); }
