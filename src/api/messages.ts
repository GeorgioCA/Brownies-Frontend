import client from './client';
import type { SendMessageRequest } from '../types';

export async function getMessages(match_id: number, page: number = 1, per_page: number = 50) { return client.get(`/matches/${match_id}/messages?page=${page}&per_page=${per_page}`); }
export async function sendMessage(match_id: number, data: SendMessageRequest) { return client.post(`/matches/${match_id}/messages`, data); }
export async function markMessagesRead(match_id: number) { return client.put(`/matches/${match_id}/messages/read`); }
export async function getWomenFirstStatus(match_id: number) { return client.get(`/matches/${match_id}/women-first-status`); }
