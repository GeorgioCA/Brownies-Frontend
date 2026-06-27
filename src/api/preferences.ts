import client from './client';
import type { NotificationSettingsRequest } from '../types';

export async function getPreferences() { return client.get('/preferences'); }
export async function updatePreferences(data: Record<string, unknown>) { return client.put('/preferences', data); }
export async function updateNotificationSettings(data: NotificationSettingsRequest) { return client.put('/preferences/notification-settings', data); }
