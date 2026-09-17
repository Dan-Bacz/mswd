const { query } = require('../config/database');

async function logAudit(userId, action, module, recordId, details, ip) {
  try {
    await query(
      'INSERT INTO audit_logs (user_id, action, module, record_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId || null, action, module || null, recordId || null, details || null, ip || null]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAudit };