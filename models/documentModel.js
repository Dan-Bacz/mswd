const { query } = require('../config/database');

async function list(beneficiaryId) {
  const rows = await query(
    `SELECT d.*, u.first_name, u.last_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.beneficiary_id = ?
     ORDER BY d.created_at DESC`,
    [beneficiaryId]
  );
  return rows;
}

async function findById(id) {
  const rows = await query('SELECT * FROM documents WHERE id = ? LIMIT 1', [id]);
  return rows.length ? rows[0] : null;
}

async function create(beneficiaryId, data, userId) {
  const result = await query(
    `INSERT INTO documents (beneficiary_id, uploaded_by, document_name, document_type, file_path, file_size, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [beneficiaryId, userId, data.document_name, data.document_type || null,
     data.file_path, data.file_size || null, data.notes || null]
  );
  return result.insertId;
}

async function remove(id) {
  await query('DELETE FROM documents WHERE id = ?', [id]);
}

module.exports = { list, findById, create, remove };