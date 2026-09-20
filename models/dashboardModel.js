const { query } = require('../config/database');

async function admin() {
  const beneficiaries = await query("SELECT COUNT(*) AS c FROM beneficiaries WHERE status = 'Active'");
  const allBeneficiaries = await query('SELECT COUNT(*) AS c FROM beneficiaries');
  const officers = await query("SELECT COUNT(*) AS c FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'officer') AND is_active = 1");
  const pendingApprovals = await query('SELECT COUNT(*) AS c FROM users WHERE is_approved = 0');
  const openCases = await query(
    `SELECT
       (SELECT COUNT(*) FROM juvenile_records WHERE case_status NOT IN ('Closed')) AS juvenile,
       (SELECT COUNT(*) FROM solo_parent_records WHERE status = 'Active') AS solo_parent,
       (SELECT COUNT(*) FROM senior_citizen_records WHERE status = 'Active') AS senior,
       (SELECT COUNT(*) FROM pwd_records WHERE status = 'Active') AS pwd`
  );
  const sectors = await query(
    `SELECT s.id, s.name, s.slug, s.is_active,
       (SELECT COUNT(*) FROM beneficiaries b WHERE b.sector_id = s.id AND b.status = 'Active') AS beneficiaries,
       (SELECT COUNT(*) FROM users u JOIN officer_assignments oa ON oa.user_id = u.id
         WHERE oa.sector_id = s.id AND oa.is_active = 1) AS officers
     FROM sectors s ORDER BY s.name`
  );
  const monthly = (await query(
    'SELECT DATE_FORMAT(registration_date, \'%Y-%m\') AS ym, COUNT(*) AS c FROM beneficiaries GROUP BY ym ORDER BY ym DESC LIMIT 6'
  )).map(m => ({ ym: m.ym, label: m.ym.slice(2).replace('-', '/'), c: m.c }));
  const recentCases = await query(
    `SELECT 'juvenile' AS sector, id, case_number AS number, case_status AS status, created_at,
            (SELECT first_name FROM beneficiaries WHERE id = juvenile_records.beneficiary_id) AS ben_name
     FROM juvenile_records
     UNION ALL
     SELECT 'solo-parent', id, record_number, status, created_at,
            (SELECT first_name FROM beneficiaries WHERE id = solo_parent_records.beneficiary_id)
     FROM solo_parent_records
     UNION ALL
     SELECT 'senior-citizens', id, record_number, status, created_at,
            (SELECT first_name FROM beneficiaries WHERE id = senior_citizen_records.beneficiary_id)
     FROM senior_citizen_records
     UNION ALL
     SELECT 'pwd', id, record_number, status, created_at,
            (SELECT first_name FROM beneficiaries WHERE id = pwd_records.beneficiary_id)
     FROM pwd_records
     ORDER BY created_at DESC LIMIT 8`
  );
  return {
    beneficiaries: beneficiaries[0].c,
    allBeneficiaries: allBeneficiaries[0].c,
    officers: officers[0].c,
    pendingApprovals: pendingApprovals[0].c,
    openCases,
    sectors,
    monthly: monthly.reverse(),
    recentCases
  };
}

async function officer(sectorSlug) {
  const cfg = require('./recordModel').SECTOR_CONFIG[sectorSlug];
  if (!cfg) return {};
  const table = cfg.table;
  const statusCol = cfg.statusColumn;
  const beneficiaries = await query(
    `SELECT COUNT(*) AS c FROM beneficiaries b WHERE b.sector_id = (SELECT id FROM sectors WHERE slug = ?) AND b.status = 'Active'`,
    [sectorSlug]
  );
  const totalRecords = await query(`SELECT COUNT(*) AS c FROM ${table}`);
  const activeRecords = await query(`SELECT COUNT(*) AS c FROM ${table} WHERE ${statusCol} NOT IN ('Inactive','Closed','Expired','Deceased')`);
  const statusBreakdown = await query(`SELECT ${statusCol} AS status, COUNT(*) AS c FROM ${table} GROUP BY ${statusCol} ORDER BY c DESC`);
  const recent = await query(
    `SELECT r.*, b.last_name, b.first_name
     FROM ${table} r JOIN beneficiaries b ON b.id = r.beneficiary_id
     ORDER BY r.created_at DESC LIMIT 6`
  );
  return {
    beneficiaries: beneficiaries[0].c,
    totalRecords: totalRecords[0].c,
    activeRecords: activeRecords[0].c,
    statusBreakdown,
    recent
  };
}

module.exports = { admin, officer };