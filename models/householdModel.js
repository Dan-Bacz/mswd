const { query } = require('../config/database');

async function list(beneficiaryId) {
  const rows = await query(
    'SELECT * FROM beneficiary_household WHERE beneficiary_id = ? ORDER BY relation, member_name',
    [beneficiaryId]
  );
  return rows;
}

async function findById(id) {
  const rows = await query('SELECT * FROM beneficiary_household WHERE id = ? LIMIT 1', [id]);
  return rows.length ? rows[0] : null;
}

async function add(beneficiaryId, data) {
  const result = await query(
    `INSERT INTO beneficiary_household (beneficiary_id, member_name, relation, date_of_birth, sex, occupation, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [beneficiaryId, data.member_name || null, data.relation || null,
     data.date_of_birth || null, data.sex || null, data.occupation || null, data.remarks || null]
  );
  return result.insertId;
}

async function remove(id) {
  await query('DELETE FROM beneficiary_household WHERE id = ?', [id]);
}

module.exports = { list, findById, add, remove };