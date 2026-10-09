import * as notificationModel from '../models/notificationModel.js';
import { notFound } from '../utils/AppError.js';

export async function list(user, query) {
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const [items, unreadCount] = await Promise.all([
    notificationModel.listForUser(user.id, { unreadOnly: query.unread === 'true', limit }),
    notificationModel.unreadCount(user.id),
  ]);
  return { items, unreadCount };
}

export async function markRead(user, id) {
  const updated = await notificationModel.markRead(id, user.id); // filtré par user_id : impossible de toucher celles d'un autre
  if (!updated) throw notFound('Notification introuvable.', 'NOTIFICATION_NOT_FOUND');
  return { id, isRead: true };
}

export async function markAllRead(user) {
  await notificationModel.markAllRead(user.id);
  return { unreadCount: 0 };
}
