const { query } = require('../config/database');

async function list({ action = '', user = '', page = 1, perPage = 20 }) {
  const where = ['1=1'];
  const params = [];
  if (action) { where.push('a.action = ?'); params.push(action); }
  if (user) { where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ?)');
    const like = `%${user}%`; params.push(like, like, like); }

  const countRows = await query(
    `SELECT COUNT(*) AS c FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id WHERE ${where.join(' AND ')}`,
    params
  );
  const total = countRows[0].c;
  const offset = (page - 1) * perPage;
  const rows = await query(
    `SELECT a.*, u.username, u.first_name, u.last_name
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    params.concat([perPage, offset])
  );
  return { rows, total };
}

module.exports = { list };