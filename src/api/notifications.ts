import client from './client';

export async function getNotifications() { return client.get('/notifications'); }
export async function getUnreadCount() { return client.get('/notifications/unread-count'); }
export async function markNotificationRead(id: number) { return client.put(`/notifications/${id}/read`); }
export async function markAllRead() { return client.put('/notifications/read-all'); }
export async function registerPushToken(token: string) { return client.post('/notifications/push-token', { token }); }
