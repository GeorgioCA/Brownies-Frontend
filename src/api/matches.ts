import client from './client';

export async function getMatches() { return client.get('/matches'); }
export async function getMatch(match_id: number) { return client.get(`/matches/${match_id}`); }
export async function unmatch(match_id: number) { return client.delete(`/matches/${match_id}`); }
