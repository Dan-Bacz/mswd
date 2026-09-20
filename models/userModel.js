const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function findByLogin(login) {
  const rows = await query(
    `SELECT u.*, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.username = ? OR u.email = ? LIMIT 1`,
    [login, login]
  );
  return rows.length ? rows[0] : null;
}

async function findByUsernameOrEmail(username, email) {
  const rows = await query(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  );
  return rows.length ? rows[0] : null;
}

async function listOfficers() {
  const rows = await query(
    `SELECT u.id, u.username, u.email, u.first_name, u.middle_name, u.last_name, u.suffix,
            u.contact_number, u.is_active, u.is_approved, u.last_login, u.created_at,
            (SELECT s.id FROM officer_assignments oa JOIN sectors s ON s.id = oa.sector_id
              WHERE oa.user_id = u.id AND oa.is_active = 1 ORDER BY oa.assigned_at DESC LIMIT 1) AS sector_id,
            (SELECT s.name FROM officer_assignments oa2 JOIN sectors s ON s.id = oa2.sector_id
              WHERE oa2.user_id = u.id AND oa2.is_active = 1 ORDER BY oa2.assigned_at DESC LIMIT 1) AS sector_name,
            (SELECT s.slug FROM officer_assignments oa3 JOIN sectors s ON s.id = oa3.sector_id
              WHERE oa3.user_id = u.id AND oa3.is_active = 1 ORDER BY oa3.assigned_at DESC LIMIT 1) AS sector_slug
     FROM users u
     WHERE u.role_id = (SELECT id FROM roles WHERE name = 'officer')
     ORDER BY u.last_name, u.first_name`
  );
  return rows;
}

async function listUsers(filter) {
  const where = [];
  const params = [];
  if (filter === 'pending') {
    where.push('u.is_approved = 0');
  }
  if (filter === 'inactive') {
    where.push('u.is_active = 0 AND u.is_approved = 1');
  }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await query(
    `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.suffix, u.contact_number,
            u.is_active, u.is_approved, u.last_login, u.created_at,
            r.name AS role_name,
            (SELECT s.name FROM officer_assignments oa JOIN sectors s ON s.id = oa.sector_id
              WHERE oa.user_id = u.id AND oa.is_active = 1 ORDER BY oa.assigned_at DESC LIMIT 1) AS sector_name
     FROM users u JOIN roles r ON r.id = u.role_id
     ${w}
     ORDER BY u.created_at DESC`,
    params
  );
  return rows;
}

async function findById(id) {
  const rows = await query(
    `SELECT u.*, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? rows[0] : null;
}

async function officersForSector(sectorId) {
  const rows = await query(
    `SELECT u.id, u.username, u.first_name, u.last_name, u.suffix, u.email
     FROM users u
     JOIN officer_assignments oa ON oa.user_id = u.id AND oa.is_active = 1 AND oa.sector_id = ?
     WHERE u.role_id = (SELECT id FROM roles WHERE name = 'officer')
       AND u.is_active = 1 AND u.is_approved = 1
     ORDER BY u.last_name, u.first_name`,
    [sectorId]
  );
  return rows;
}

async function findOfficerById(id) {
  const rows = await query(
    `SELECT u.*, r.name AS role_name,
            (SELECT oa.sector_id FROM officer_assignments oa
              WHERE oa.user_id = u.id AND oa.is_active = 1 ORDER BY oa.assigned_at DESC LIMIT 1) AS sector_id,
            (SELECT s.name FROM officer_assignments oa2 JOIN sectors s ON s.id = oa2.sector_id
              WHERE oa2.user_id = u.id AND oa2.is_active = 1 ORDER BY oa2.assigned_at DESC LIMIT 1) AS sector_name,
            (SELECT s.slug FROM officer_assignments oa3 JOIN sectors s ON s.id = oa3.sector_id
              WHERE oa3.user_id = u.id AND oa3.is_active = 1 ORDER BY oa3.assigned_at DESC LIMIT 1) AS sector_slug
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND r.name = 'officer' LIMIT 1`,
    [id]
  );
  return rows.length ? rows[0] : null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, suffix, contact_number, role_id, is_active, is_approved)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.username, data.email, data.password_hash, data.first_name, data.middle_name || null,
     data.last_name, data.suffix || null, data.contact_number || null, data.role_id,
     data.is_active === undefined ? 1 : data.is_active,
     data.is_approved === undefined ? 1 : data.is_approved]
  );
  return result.insertId;
}

async function updateProfile(id, data) {
  await query(
    'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, suffix = ?, contact_number = ?, email = ? WHERE id = ?',
    [data.first_name, data.middle_name || null, data.last_name, data.suffix || null, data.contact_number || null, data.email, id]
  );
}

async function setPassword(id, hash) {
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
}

async function setActive(id, active) {
  await query('UPDATE users SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
}

async function setApproval(id, approved) {
  await query('UPDATE users SET is_approved = ?, is_active = ? WHERE id = ?', [approved ? 1 : 0, approved ? 1 : 0, id]);
}

async function touchLastLogin(id) {
  await query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
}

async function updateLastLoginFromSession() {
  // no-op kept for interface consistency
}

async function getRoleId(roleName) {
  const rows = await query('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);
  return rows.length ? rows[0].id : null;
}

module.exports = {
  findByLogin,
  findByUsernameOrEmail,
  listOfficers,
  listUsers,
  findById,
  findOfficerById,
  officersForSector,
  create,
  updateProfile,
  setPassword,
  setActive,
  setApproval,
  touchLastLogin,
  getRoleId,
  hash: bcrypt.hashSync,
  compare: bcrypt.compare
};