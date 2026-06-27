import client from './client';

export async function shareProfile(match_id: number) { return client.post(`/family-share/${match_id}`); }
export async function getSharedProfile(token: string) { return client.get(`/shared/${token}`); }
export async function deleteShare(share_id: number) { return client.delete(`/family-share/${share_id}`); }
