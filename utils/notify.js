const { query } = require('../config/database');

async function createNotification(userId, title, message, type, link) {
  try {
    await query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message || null, type || 'info', link || null]
    );
    return true;
  } catch (err) {
    console.error('Notification error:', err.message);
    return false;
  }
}

async function createNotificationToRole(roleName, title, message, type, link) {
  const users = await query(
    'SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = ?) AND is_active = 1',
    [roleName]
  );
  for (const u of users) {
    await createNotification(u.id, title, message, type, link);
  }
}

async function getUnreadCount(userId) {
  const rows = await query(
    'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return rows[0].cnt;
}

async function markAllRead(userId) {
  await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
}

module.exports = { createNotification, createNotificationToRole, getUnreadCount, markAllRead };