const { query } = require('../config/database');

const SEED_SECTORS = [
  { name: 'Juvenile', slug: 'juvenile', description: 'Children in conflict with the law and juvenile welfare cases.' },
  { name: 'Solo Parents', slug: 'solo-parent', description: 'Assistance and programs for solo parents.' },
  { name: 'Senior Citizens', slug: 'senior-citizens', description: 'Programs and services for senior citizens.' },
  { name: 'PWD', slug: 'pwd', description: 'Persons with disabilities support and registration.' }
];

async function listAll() {
  return query('SELECT * FROM sectors ORDER BY name');
}

async function listActive() {
  return query('SELECT * FROM sectors WHERE is_active = 1 ORDER BY name');
}

async function findById(id) {
  const rows = await query('SELECT * FROM sectors WHERE id = ? LIMIT 1', [id]);
  return rows.length ? rows[0] : null;
}

async function findBySlug(slug) {
  const rows = await query('SELECT * FROM sectors WHERE slug = ? LIMIT 1', [slug]);
  return rows.length ? rows[0] : null;
}

async function create(data) {
  const result = await query(
    'INSERT INTO sectors (name, slug, description, is_active) VALUES (?, ?, ?, ?)',
    [data.name, data.slug, data.description || null, data.is_active === undefined ? 1 : data.is_active]
  );
  return result.insertId;
}

async function update(id, data) {
  await query(
    'UPDATE sectors SET name = ?, description = ? WHERE id = ?',
    [data.name, data.description || null, id]
  );
}

async function setActive(id, active) {
  await query('UPDATE sectors SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
}

async function countBeneficiaries(sectorId) {
  const rows = await query(
    'SELECT COUNT(*) AS c FROM beneficiaries WHERE sector_id = ? AND is_active = 1',
    [sectorId]
  );
  return rows[0].c;
}

module.exports = { SEED_SECTORS, listAll, listActive, findById, findBySlug, create, update, setActive, countBeneficiaries };