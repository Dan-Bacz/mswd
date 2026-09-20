const { query } = require('../config/database');

async function list(sectorSlug, recordId) {
  if (!recordId) return [];
  const rows = await query(
    `SELECT f.*, u.first_name, u.last_name
     FROM case_followups f
     LEFT JOIN users u ON u.id = f.assigned_to
     WHERE f.sector_record_type = ? AND f.sector_record_id = ?
     ORDER BY f.scheduled_date ASC`,
    [sectorSlug, recordId]
  );
  return rows;
}

async function create(sectorSlug, recordId, beneficiaryId, data) {
  const result = await query(
    `INSERT INTO case_followups
      (beneficiary_id, sector_record_id, sector_record_type, followup_type, description,
       scheduled_date, status, assigned_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [beneficiaryId, recordId, sectorSlug, data.followup_type || 'General',
     data.description || null, data.scheduled_date || null, data.status || 'Scheduled',
     data.assigned_to || null]
  );
  return result.insertId;
}

async function setStatus(id, status, result) {
  const extra = status === 'Completed' ? ', completed_date = CURDATE()' : '';
  await query(
    `UPDATE case_followups SET status = ?, result = ${result !== undefined ? '?' : 'result'} ${extra} WHERE id = ?`,
    result !== undefined ? [status, result, id] : [status, id]
  );
}

async function upcoming(days = 7) {
  const rows = await query(
    `SELECT f.*, b.last_name AS ben_last, b.first_name AS ben_first, b.barangay
     FROM case_followups f
     JOIN beneficiaries b ON b.id = f.beneficiary_id
     WHERE f.status = 'Scheduled' AND f.scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY f.scheduled_date ASC LIMIT 20`,
    [days]
  );
  return rows;
}

module.exports = { list, create, setStatus, upcoming };