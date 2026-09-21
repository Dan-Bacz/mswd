const { query } = require('../config/database');

async function listServices({ sectorId = null, includeInactive = false, search = '' } = {}) {
  const where = ['1=1'];
  const params = [];
  if (sectorId) {
    where.push('s.sector_id = ?');
    params.push(sectorId);
  }
  if (!includeInactive) {
    where.push('s.is_active = 1');
  }
  if (search) {
    where.push('(s.name LIKE ? OR s.category LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like);
  }
  const rows = await query(
    `SELECT s.id, s.name, s.description, s.category, s.sector_id, s.is_active,
            sec.name AS sector_name, sec.slug AS sector_slug
     FROM services s
     LEFT JOIN sectors sec ON sec.id = s.sector_id
     WHERE ${where.join(' AND ')}
     ORDER BY sector_name, s.name`,
    params
  );
  return rows;
}

async function findById(id) {
  const rows = await query(
    `SELECT s.*, sec.name AS sector_name, sec.slug AS sector_slug
     FROM services s LEFT JOIN sectors sec ON sec.id = s.sector_id
     WHERE s.id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? rows[0] : null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO services (name, description, sector_id, category, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [data.name, data.description || null, data.sector_id || null,
     data.category || null, data.is_active === undefined ? 1 : (data.is_active ? 1 : 0)]
  );
  return result.insertId;
}

async function update(id, data) {
  await query(
    `UPDATE services SET name = ?, description = ?, sector_id = ?, category = ?, is_active = ? WHERE id = ?`,
    [data.name, data.description || null, data.sector_id || null,
     data.category || null, data.is_active ? 1 : 0, id]
  );
}

async function setActive(id, active) {
  await query('UPDATE services SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
}

async function remove(id) {
  await query('DELETE FROM services WHERE id = ?', [id]);
}

async function provide(beneficiaryId, data, userId) {
  const result = await query(
    `INSERT INTO case_services (beneficiary_id, service_id, provided_by, date_provided, details, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [beneficiaryId, data.service_id, userId,
     data.date_provided || new Date().toISOString().slice(0, 10),
     data.details || null, data.status || 'Completed']
  );
  return result.insertId;
}

async function listProvided(beneficiaryId) {
  const rows = await query(
    `SELECT cs.id, cs.beneficiary_id, cs.service_id, cs.provided_by, cs.date_provided,
            cs.details, cs.status, cs.created_at,
            sv.name AS service_name, sv.category,
            u.first_name AS provided_first, u.last_name AS provided_last
     FROM case_services cs
     JOIN services sv ON sv.id = cs.service_id
     LEFT JOIN users u ON u.id = cs.provided_by
     WHERE cs.beneficiary_id = ?
     ORDER BY cs.date_provided DESC, cs.created_at DESC`,
    [beneficiaryId]
  );
  return rows;
}

async function countBySector(monthStart, monthEnd) {
  const rows = await query(
    `SELECT sec.name AS sector_name, sec.slug AS sector_slug, COUNT(*) AS total
     FROM case_services cs
     JOIN beneficiaries b ON b.id = cs.beneficiary_id
     JOIN sectors sec ON sec.id = b.sector_id
     WHERE cs.date_provided >= ? AND cs.date_provided < ?
     GROUP BY sec.id, sec.name, sec.slug
     ORDER BY sec.name`,
    [monthStart, monthEnd]
  );
  return rows;
}

async function countInMonth(monthStart, monthEnd) {
  const rows = await query(
    'SELECT COUNT(*) AS total FROM case_services WHERE date_provided >= ? AND date_provided < ?',
    [monthStart, monthEnd]
  );
  return rows.length ? rows[0].total : 0;
}

module.exports = { listServices, findById, create, update, setActive, remove, provide, listProvided, countBySector, countInMonth };