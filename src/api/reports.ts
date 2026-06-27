import client from './client';
import type { ReportRequest, BlockRequest } from '../types';

export async function reportUser(data: ReportRequest) { return client.post('/reports', data); }
export async function blockUser(data: BlockRequest) { return client.post('/blocks', data); }
export async function unblockUser(target_id: number) { return client.delete(`/blocks/${target_id}`); }
export async function getBlockedUsers() { return client.get('/blocks'); }
