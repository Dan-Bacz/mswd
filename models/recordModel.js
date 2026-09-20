const { query } = require('../config/database');

// Per-sector record (case) configuration. Column names and ENUM values match database/schema.sql.
const SECTOR_CONFIG = {
  'juvenile': {
    table: 'juvenile_records',
    title: 'Juvenile Cases',
    item: 'Juvenile Case',
    numberColumn: 'case_number',
    statusColumn: 'case_status',
    defaultStatus: 'New',
    statuses: ['New', 'Under Assessment', 'Active', 'Under Intervention', 'For Follow-up', 'Closed', 'Referred'],
    listCols: ['case_number', 'case_type', 'case_status', 'risk_level', 'date_opened'],
    fields: [
      { col: 'case_number', label: 'Case Number', hint: 'Leave blank to auto-generate' },
      { col: 'case_type', label: 'Case Type' },
      { col: 'case_description', label: 'Case Description', type: 'textarea' },
      { col: 'guardian_name', label: 'Guardian / Parent Name' },
      { col: 'guardian_contact', label: 'Guardian Contact No.' },
      { col: 'school_name', label: 'School / Institution' },
      { col: 'grade_level', label: 'Grade / Year Level' },
      { col: 'risk_level', label: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { col: 'date_opened', label: 'Date Opened', type: 'date' },
      { col: 'date_closed', label: 'Date Closed', type: 'date' },
      { col: 'outcome', label: 'Case Outcome', type: 'textarea' }
    ]
  },
  'solo-parent': {
    table: 'solo_parent_records',
    title: 'Solo Parent Records',
    item: 'Solo Parent Record',
    numberColumn: 'record_number',
    statusColumn: 'status',
    defaultStatus: 'Active',
    statuses: ['Active', 'Inactive', 'Expired'],
    listCols: ['record_number', 'spouse_status', 'number_of_children', 'status', 'valid_until'],
    fields: [
      { col: 'record_number', label: 'Record Number', hint: 'Leave blank to auto-generate' },
      { col: 'spouse_name', label: 'Spouse Name' },
      { col: 'spouse_status', label: 'Spouse Status', type: 'select', options: ['Deceased', 'Separated', 'Abandoned', 'Missing', 'Other'] },
      { col: 'number_of_children', label: 'Number of Children', type: 'number' },
      { col: 'monthly_income', label: 'Monthly Income', type: 'number' },
      { col: 'employment_status', label: 'Employment Status', type: 'select', options: ['Unemployed', 'Self-employed', 'Employed', 'Casual', 'OFW'] },
      { col: 'employer_name', label: 'Employer / Business Name' },
      { col: 'needs_assessment', label: 'Needs Assessment', type: 'textarea' },
      { col: 'registration_type', label: 'Registration Type', type: 'select', options: ['Initial', 'Renewal'] },
      { col: 'pcso_number', label: 'PCSO Number' },
      { col: 'valid_until', label: 'Valid Until', type: 'date' }
    ]
  },
  'senior-citizens': {
    table: 'senior_citizen_records',
    title: 'Senior Citizen Records',
    item: 'Senior Citizen Record',
    numberColumn: 'record_number',
    statusColumn: 'status',
    defaultStatus: 'Active',
    statuses: ['Active', 'Inactive', 'Deceased'],
    listCols: ['record_number', 'osca_number', 'pension_status', 'status', 'monthly_pension'],
    fields: [
      { col: 'record_number', label: 'Record Number', hint: 'Leave blank to auto-generate' },
      { col: 'osca_number', label: 'OSCA ID Number' },
      { col: 'pension_status', label: 'Pension Status', type: 'select', options: ['Received', 'Not Received', 'Suspended'] },
      { col: 'monthly_pension', label: 'Monthly Pension', type: 'number' },
      { col: 'health_condition', label: 'Health Condition', type: 'textarea' },
      { col: 'living_situation', label: 'Living Situation', type: 'select', options: ['With Family', 'With Spouse', 'Alone', 'In Institution'] },
      { col: 'emergency_contact_name', label: 'Emergency Contact Name' },
      { col: 'emergency_contact_number', label: 'Emergency Contact No.' }
    ]
  },
  'pwd': {
    table: 'pwd_records',
    title: 'PWD Records',
    item: 'PWD Record',
    numberColumn: 'record_number',
    statusColumn: 'status',
    defaultStatus: 'Active',
    statuses: ['Active', 'Inactive'],
    listCols: ['record_number', 'pwd_number', 'disability_type', 'disability_level', 'status'],
    fields: [
      { col: 'record_number', label: 'Record Number', hint: 'Leave blank to auto-generate' },
      { col: 'pwd_number', label: 'PWD ID Number' },
      { col: 'disability_type', label: 'Disability Type' },
      { col: 'disability_cause', label: 'Disability Cause' },
      { col: 'disability_level', label: 'Disability Level', type: 'select', options: ['Mild', 'Moderate', 'Severe', 'Profound'] },
      { col: 'assistive_device', label: 'Assistive Device' },
      { col: 'education_attainment', label: 'Education Attainment', type: 'select', options: ['Elementary', 'High School', 'College', 'Vocational', 'None'] },
      { col: 'employment_status', label: 'Employment Status', type: 'select', options: ['Unemployed', 'Self-employed', 'Employed', 'Student', 'Retired'] },
      { col: 'monthly_income', label: 'Monthly Income', type: 'number' },
      { col: 'guardian_name', label: 'Guardian Name' },
      { col: 'guardian_contact', label: 'Guardian Contact No.' }
    ]
  }
};

const SECTOR_SLUGS = Object.keys(SECTOR_CONFIG);

function sectorConfig(slug) {
  return SECTOR_CONFIG[slug] || null;
}

async function generateRecordNumber(slug) {
  const cfg = sectorConfig(slug);
  if (!cfg) return null;
  const prefix = { 'juvenile': 'JUV', 'solo-parent': 'SP', 'senior-citizens': 'SC', 'pwd': 'PWD' }[slug] || 'REC';
  const y = new Date().getFullYear();
  const ms = String(Date.now()).slice(-6);
  const rnd = String(Math.floor(Math.random() * 90) + 10);
  return prefix + '-' + y + '-' + ms + rnd;
}

async function list(sectorSlug, { search = '', status = '', page = 1, perPage = 15, officer = null, beneficiary = null }) {
  const cfg = sectorConfig(sectorSlug);
  if (!cfg) return { rows: [], total: 0 };

  const where = ['1=1'];
  const params = [];
  if (beneficiary) { where.push('r.beneficiary_id = ?'); params.push(beneficiary); }
  if (search) {
    where.push('(r.' + cfg.numberColumn + ' LIKE ? OR b.last_name LIKE ? OR b.first_name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (status && status !== 'all') { where.push('r.' + cfg.statusColumn + ' = ?'); params.push(status); }
  if (officer) { where.push('r.assigned_officer_id = ?'); params.push(officer); }

  const countRows = await query(
    `SELECT COUNT(*) AS c FROM ${cfg.table} r JOIN beneficiaries b ON b.id = r.beneficiary_id WHERE ${where.join(' AND ')}`,
    params
  );
  const total = countRows[0].c;
  const offset = (page - 1) * perPage;
  const rows = await query(
    `SELECT r.*, b.last_name, b.first_name, b.middle_name, b.suffix, b.barangay, b.sex, b.date_of_birth
     FROM ${cfg.table} r JOIN beneficiaries b ON b.id = r.beneficiary_id
     WHERE ${where.join(' AND ')}
     ORDER BY r.created_at DESC
     LIMIT ${perPage} OFFSET ${offset}`,
    params
  );
  return { rows, total };
}

async function findById(sectorSlug, id) {
  const cfg = sectorConfig(sectorSlug);
  if (!cfg) return null;
  const rows = await query(
    `SELECT r.*, b.last_name, b.first_name, b.middle_name, b.suffix, b.sex, b.date_of_birth,
            b.barangay, b.contact_number, b.address,
            u.username AS officer_username, u.first_name AS officer_first, u.last_name AS officer_last
     FROM ${cfg.table} r
     JOIN beneficiaries b ON b.id = r.beneficiary_id
     LEFT JOIN users u ON u.id = r.assigned_officer_id
     WHERE r.id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? rows[0] : null;
}

async function create(sectorSlug, data) {
  const cfg = sectorConfig(sectorSlug);
  if (!cfg) throw new Error('Unknown sector: ' + sectorSlug);
  const cols = [];
  const marks = [];
  const params = [];
  for (const f of cfg.fields) {
    if (f.col === cfg.statusColumn) continue;
    let v = data[f.col];
    if (v !== undefined) {
      if (f.col === cfg.numberColumn && (v === '' || v === null)) v = await generateRecordNumber(sectorSlug);
      cols.push(f.col);
      marks.push('?');
      params.push(v === '' || v === undefined ? null : v);
    }
  }
  cols.push('beneficiary_id');
  marks.push('?');
  params.push(data.beneficiary_id);
  cols.push('assigned_officer_id');
  marks.push('?');
  params.push(data.assigned_officer_id || data.assignedOfficerId || null);
  cols.push(cfg.statusColumn);
  marks.push('?');
  params.push(data[cfg.statusColumn] || cfg.defaultStatus);
  const result = await query(
    `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${marks.join(', ')})`,
    params
  );
  return result.insertId;
}

async function update(sectorSlug, id, data) {
  const cfg = sectorConfig(sectorSlug);
  if (!cfg) throw new Error('Unknown sector: ' + sectorSlug);
  const sets = [];
  const params = [];
  for (const f of cfg.fields) {
    if (f.col === cfg.statusColumn) continue;
    const v = data[f.col];
    if (v === undefined) continue;
    sets.push(f.col + ' = ?');
    params.push(v === '' ? null : v);
  }
  if (data.assignedOfficerId !== undefined) {
    sets.push('assigned_officer_id = ?');
    params.push(data.assignedOfficerId || null);
  }
  if (data[cfg.statusColumn] !== undefined) {
    sets.push(cfg.statusColumn + ' = ?');
    params.push(data[cfg.statusColumn]);
  }
  if (sets.length === 0) return;
  params.push(id);
  await query(`UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE id = ?`, params);
}

async function setStatus(sectorSlug, id, status) {
  const cfg = sectorConfig(sectorSlug);
  if (!cfg) return;
  await query(`UPDATE ${cfg.table} SET ${cfg.statusColumn} = ? WHERE id = ?`, [status, id]);
}

async function getStatus(sectorSlug, id) {
  const cfg = sectorConfig(sectorSlug);
  if (!cfg) return null;
  const rows = await query(`SELECT ${cfg.statusColumn} AS status FROM ${cfg.table} WHERE id = ? LIMIT 1`, [id]);
  return rows.length ? rows[0].status : null;
}

module.exports = {
  SECTOR_CONFIG,
  SECTOR_SLUGS,
  sectorConfig,
  generateRecordNumber,
  list,
  findById,
  create,
  update,
  setStatus,
  getStatus
};