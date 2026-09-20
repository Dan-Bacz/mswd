const { query } = require('../config/database');

async function list(userId, page = 1, perPage = 15) {
  const offset = (page - 1) * perPage;
  const rows = await query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, perPage, offset]
  );
  const countRows = await query(
    'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ?',
    [userId]
  );
  return { rows, total: countRows[0].c };
}

async function markRead(userId, id) {
  await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
}

module.exports = { list, markRead };