const { query } = require('../config/database');

const SEARCHABLE = ["b.first_name", "b.middle_name", "b.last_name", "b.barangay"];

function generateNumber() {
  const y = new Date().getFullYear();
  const ms = String(Date.now()).slice(-6);
  const rnd = String(Math.floor(Math.random() * 90) + 10);
  return 'BN-' + y + '-' + ms + rnd;
}

async function list({ sectorId, barangay = '', search = '', status = '', page = 1, perPage = 15 }) {
  const where = ['1=1'];
  const params = [];
  if (sectorId) { where.push('b.sector_id = ?'); params.push(sectorId); }
  if (barangay) { where.push('b.barangay = ?'); params.push(barangay); }
  if (search) {
    where.push('(' + SEARCHABLE.map(c => c + ' LIKE ?').join(' OR ') + ')');
    const like = `%${search}%`;
    SEARCHABLE.forEach(() => params.push(like));
  }
  if (status && status !== 'all') { where.push('b.status = ?'); params.push(status); }

  const countRows = await query(
    `SELECT COUNT(*) AS c FROM beneficiaries b WHERE ${where.join(' AND ')}`,
    params
  );
  const total = countRows[0].c;
  const offset = (page - 1) * perPage;
  const rows = await query(
    `SELECT b.*, s.name AS sector_name, s.slug AS sector_slug,
            (SELECT COUNT(*) FROM juvenile_records j WHERE j.beneficiary_id = b.id) AS juvenile_count,
            (SELECT COUNT(*) FROM solo_parent_records sp WHERE sp.beneficiary_id = b.id) AS sp_count,
            (SELECT COUNT(*) FROM senior_citizen_records sc WHERE sc.beneficiary_id = b.id) AS sc_count,
            (SELECT COUNT(*) FROM pwd_records p WHERE p.beneficiary_id = b.id) AS pwd_count
     FROM beneficiaries b JOIN sectors s ON s.id = b.sector_id
     WHERE ${where.join(' AND ')}
     ORDER BY b.last_name, b.first_name
     LIMIT ${perPage} OFFSET ${offset}`,
    params
  );
  return { rows, total };
}

async function findById(id) {
  const rows = await query(
    `SELECT b.*, s.name AS sector_name, s.slug AS sector_slug,
            reg.first_name AS reg_first, reg.last_name AS reg_last,
            (SELECT COUNT(*) FROM juvenile_records j WHERE j.beneficiary_id = b.id) AS juvenile_count,
            (SELECT COUNT(*) FROM solo_parent_records sp WHERE sp.beneficiary_id = b.id) AS sp_count,
            (SELECT COUNT(*) FROM senior_citizen_records sc WHERE sc.beneficiary_id = b.id) AS sc_count,
            (SELECT COUNT(*) FROM pwd_records p WHERE p.beneficiary_id = b.id) AS pwd_count
     FROM beneficiaries b
     JOIN sectors s ON s.id = b.sector_id
     LEFT JOIN users reg ON reg.id = b.registered_by
     WHERE b.id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? rows[0] : null;
}

async function create(data) {
  const result = await query(
    `INSERT INTO beneficiaries
      (beneficiary_number, sector_id, first_name, middle_name, last_name, suffix, date_of_birth,
       sex, civil_status, address, barangay, contact_number, email, registration_date, status, registered_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [generateNumber(), data.sector_id, data.first_name, data.middle_name || null, data.last_name,
     data.suffix || null, data.date_of_birth || null, data.sex || null, data.civil_status || null,
     data.address || null, data.barangay || null, data.contact_number || null, data.email || null,
     data.registration_date || null, data.status || 'Active', data.registered_by || null]
  );
  return result.insertId;
}

async function update(id, data) {
  await query(
    `UPDATE beneficiaries SET
       sector_id = ?, first_name = ?, middle_name = ?, last_name = ?, suffix = ?, date_of_birth = ?,
       sex = ?, civil_status = ?, address = ?, barangay = ?, contact_number = ?, email = ?, status = ?
     WHERE id = ?`,
    [data.sector_id, data.first_name, data.middle_name || null, data.last_name, data.suffix || null,
     data.date_of_birth || null, data.sex || null, data.civil_status || null, data.address || null,
     data.barangay || null, data.contact_number || null, data.email || null, data.status || 'Active', id]
  );
}

async function setStatus(id, status) {
  await query('UPDATE beneficiaries SET status = ? WHERE id = ?', [status, id]);
}

async function barangays() {
  const rows = await query(
    'SELECT DISTINCT barangay FROM beneficiaries WHERE barangay IS NOT NULL AND barangay != \'\' ORDER BY barangay'
  );
  return rows.map(r => r.barangay);
}

module.exports = { generateNumber, list, findById, create, update, setStatus, barangays };