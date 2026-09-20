const { query } = require('../config/database');

function recordType(sectorSlug) {
  const t = {
    'juvenile': 'juvenile',
    'solo-parent': 'solo_parent',
    'senior-citizens': 'senior_citizen',
    'pwd': 'pwd'
  }[sectorSlug];
  return t || sectorSlug;
}

async function list(sectorSlug, recordId) {
  if (!recordId) return [];
  const rows = await query(
    `SELECT n.*, u.first_name, u.last_name, u.suffix,
            (SELECT r.name FROM roles r WHERE r.id = u.role_id) AS role_name
     FROM case_notes n
     JOIN users u ON u.id = n.created_by
     WHERE n.sector_record_type = ? AND n.sector_record_id = ?
     ORDER BY n.created_at ASC`,
    [sectorSlug, recordId]
  );
  return rows;
}

async function listForBeneficiary(beneficiaryId, limit = 50) {
  const rows = await query(
    `SELECT n.*, u.first_name, u.last_name,
            (SELECT r.name FROM roles r WHERE r.id = u.role_id) AS role_name
     FROM case_notes n
     JOIN users u ON u.id = n.created_by
     WHERE n.beneficiary_id = ?
     ORDER BY n.created_at DESC LIMIT ?`,
    [beneficiaryId, limit]
  );
  return rows;
}

async function create(sectorSlug, recordId, beneficiaryId, noteText, userId) {
  const result = await query(
    'INSERT INTO case_notes (beneficiary_id, sector_record_id, sector_record_type, note, created_by) VALUES (?, ?, ?, ?, ?)',
    [beneficiaryId, recordId, sectorSlug, noteText, userId]
  );
  return result.insertId;
}

module.exports = { recordType, list, listForBeneficiary, create };