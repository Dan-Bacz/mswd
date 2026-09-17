const { query } = require('../config/database');
const { logAudit } = require('../utils/audit');

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
}

async function dashboard(req, res) {
  try {
    const [beneficiaryCounts, sectorCounts, recentBeneficiaries, recentUsers, serviceCount, pendingOfficers, caseTotals, recentCases] = await Promise.all([
      query(`SELECT s.slug, COUNT(b.id) AS cnt FROM sectors s LEFT JOIN beneficiaries b ON b.sector_id = s.id GROUP BY s.id, s.slug`),
      query(`SELECT sector_id, COUNT(*) AS cnt FROM beneficiaries GROUP BY sector_id`),
      query(`SELECT b.*, s.slug AS sector_slug, s.name AS sector_name FROM beneficiaries b JOIN sectors s ON s.id = b.sector_id ORDER BY b.created_at DESC LIMIT 8`),
      query(`SELECT id, username, first_name, last_name, role_id, is_active, is_approved, created_at FROM users ORDER BY created_at DESC LIMIT 6`),
      query(`SELECT COUNT(*) AS cnt FROM services`),
      query(`SELECT COUNT(*) AS cnt FROM users WHERE is_approved = 0`),
      query(`SELECT COUNT(*) AS cnt FROM juvenile_records`),
      query(`SELECT jr.id, jr.case_number, jr.case_status, jr.date_opened, b.first_name, b.last_name, b.beneficiary_number
             FROM juvenile_records jr JOIN beneficiaries b ON b.id = jr.beneficiary_id
             ORDER BY jr.created_at DESC LIMIT 6`)
    ]);

    const countsBySector = {};
    const sectorSlugById = {};
    sectorCounts.forEach(r => {
      countsBySector[r.sector_id] = r.cnt;
    });

    const activeAssignments = await query(
      `SELECT s.slug, s.name, COUNT(oa.id) AS officers
       FROM sectors s LEFT JOIN officer_assignments oa ON oa.sector_id = s.id AND oa.is_active = 1
       GROUP BY s.id, s.slug, s.name`
    );

    const totalOfficers = await query(`SELECT COUNT(*) AS cnt FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'officer')`);

    res.render('admin/dashboard', {
      title: 'Administrator Dashboard | MSWD Management System',
      breadcrumbs: [{ label: 'Dashboard', url: '/admin' }],
      countsBySector,
      sectorSlugById,
      beneficiaryCounts,
      activeAssignments,
      recentBeneficiaries,
      recentUsers,
      serviceCount: serviceCount[0].cnt,
      pendingOfficers: pendingOfficers[0].cnt,
      caseTotals: caseTotals[0].cnt,
      recentCases,
      totalOfficers: totalOfficers[0].cnt,
      totalBeneficiaries: beneficiaryCounts.reduce((sum, r) => sum + Number(r.cnt), 0)
    });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}

async function listAllBeneficiaries(req, res) {
  const page = parseInt(req.query.page || '1', 10);
  const perPage = 15;
  const offset = (page - 1) * perPage;
  const search = (req.query.search || '').trim();
  const sectorFilter = (req.query.sector || '').trim();
  const statusFilter = (req.query.status || '').trim();
  const barangayFilter = (req.query.barangay || '').trim();

  let where = ' WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND (b.first_name LIKE ? OR b.last_name LIKE ? OR CONCAT(b.first_name, " ", b.last_name) LIKE ? OR b.beneficiary_number LIKE ? OR b.contact_number LIKE ? OR b.email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s);
  }
  if (sectorFilter) {
    where += ' AND b.sector_id = ?';
    params.push(sectorFilter);
  }
  if (statusFilter) {
    where += ' AND b.status = ?';
    params.push(statusFilter);
  }
  if (barangayFilter) {
    where += ' AND b.barangay = ?';
    params.push(barangayFilter);
  }

  try {
    const [rows, countRows, barangays, sectors] = await Promise.all([
      query(
        `SELECT b.*, s.name AS sector_name, s.slug AS sector_slug
         FROM beneficiaries b JOIN sectors s ON s.id = b.sector_id ${where}
         ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
        [...params, perPage, offset]
      ),
      query(`SELECT COUNT(*) AS cnt FROM beneficiaries b ${where}`, params),
      query(`SELECT DISTINCT barangay FROM beneficiaries WHERE barangay IS NOT NULL AND barangay != '' ORDER BY barangay`),
      query(`SELECT id, name, slug FROM sectors WHERE is_active = 1 ORDER BY name`)
    ]);

    const total = countRows[0].cnt;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    res.render('admin/beneficiaries', {
      title: 'All Beneficiaries | MSWD',
      breadcrumbs: [{ label: 'Beneficiaries', url: '/admin/beneficiaries' }],
      beneficiaries: rows,
      total,
      page,
      totalPages,
      search,
      sectorFilter,
      statusFilter,
      barangayFilter,
      barangays,
      sectors
    });
  } catch (err) {
    console.error('List beneficiaries error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}

async function newBeneficiaryForm(req, res) {
  const sectors = await query('SELECT * FROM sectors WHERE is_active = 1 ORDER BY name');
  const preselected = req.query.sector || '';
  res.render('admin/beneficiary_form', {
    title: 'Add Beneficiary | MSWD',
    breadcrumbs: [
      { label: 'Beneficiaries', url: '/admin/beneficiaries' },
      { label: 'Add Beneficiary', url: '' }
    ],
    sectors,
    beneficiary: null,
    formAction: '/admin/beneficiaries',
    preselected
  });
}

async function createBeneficiary(req, res) {
  const data = req.body;
  const sectorId = data.sector_id;
  const sector = await query('SELECT * FROM sectors WHERE id = ? AND is_active = 1', [sectorId]);
  if (sector.length === 0) {
    req.flash('error', 'Invalid sector selected.');
    return res.redirect('/admin/beneficiaries/new');
  }

  const bn = `${sector[0].slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const _csrf = data._csrf;
  delete data._csrf;

  try {
    const result = await query(
      `INSERT INTO beneficiaries
       (beneficiary_number, sector_id, first_name, middle_name, last_name, suffix, date_of_birth, sex, civil_status, address, barangay, contact_number, email, registration_date, status, registered_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bn, sectorId, data.first_name, data.middle_name || null, data.last_name, data.suffix || null,
       data.date_of_birth || null, data.sex || null, data.civil_status || null, data.address || null,
       data.barangay || null, data.contact_number || null, data.email || null,
       data.registration_date || new Date().toISOString().slice(0, 10), data.status || 'Active', req.session.user.id]
    );

    await logAudit(req.session.user.id, 'beneficiary_create', 'beneficiaries', result.insertId, `Created beneficiary ${data.first_name} ${data.last_name} in ${sector[0].name} sector`, getClientIp(req));
    req.flash('success', 'Beneficiary registered successfully.');
    res.redirect(`/admin/beneficiaries/${result.insertId}`);
  } catch (err) {
    console.error('Create beneficiary error:', err.message);
    req.flash('error', 'Failed to create beneficiary.');
    res.redirect('/admin/beneficiaries/new');
  }
}

async function viewBeneficiary(req, res) {
  const id = req.params.id;
  try {
    const rows = await query(
      `SELECT b.*, s.name AS sector_name, s.slug AS sector_slug,
         u.first_name AS reg_by_first, u.last_name AS reg_by_last
       FROM beneficiaries b
       JOIN sectors s ON s.id = b.sector_id
       LEFT JOIN users u ON u.id = b.registered_by
       WHERE b.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).render('errors/404', { title: 'Not Found' });
    const ben = rows[0];

    const [juvenile, soloParent, senior, pwd, services, notes, followups, documents] = await Promise.all([
      query('SELECT * FROM juvenile_records WHERE beneficiary_id = ?', [id]),
      query('SELECT * FROM solo_parent_records WHERE beneficiary_id = ?', [id]),
      query('SELECT * FROM senior_citizen_records WHERE beneficiary_id = ?', [id]),
      query('SELECT * FROM pwd_records WHERE beneficiary_id = ?', [id]),
      query(`SELECT cs.*, s.name AS service_name FROM case_services cs JOIN services s ON s.id = cs.service_id WHERE cs.beneficiary_id = ? ORDER BY cs.date_provided DESC`, [id]),
      query(`SELECT cn.*, u.first_name, u.last_name FROM case_notes cn LEFT JOIN users u ON u.id = cn.created_by WHERE cn.beneficiary_id = ? ORDER BY cn.created_at DESC`, [id]),
      query(`SELECT * FROM case_followups WHERE beneficiary_id = ? ORDER BY scheduled_date DESC`, [id]),
      query('SELECT * FROM documents WHERE beneficiary_id = ? ORDER BY created_at DESC', [id])
    ]);

    res.render('admin/beneficiary_view', {
      title: `${ben.first_name} ${ben.last_name} | MSWD`,
      breadcrumbs: [
        { label: 'Beneficiaries', url: '/admin/beneficiaries' },
        { label: `${ben.first_name} ${ben.last_name}`, url: '' }
      ],
      ben,
      juvenile,
      soloParent,
      senior,
      pwd,
      services,
      notes,
      followups,
      documents
    });
  } catch (err) {
    console.error('View beneficiary error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}

async function editBeneficiaryForm(req, res) {
  const id = req.params.id;
  const sectors = await query('SELECT * FROM sectors WHERE is_active = 1 ORDER BY name');
  const rows = await query('SELECT * FROM beneficiaries WHERE id = ?', [id]);
  if (rows.length === 0) return res.status(404).render('errors/404', { title: 'Not Found' });

  res.render('admin/beneficiary_form', {
    title: 'Edit Beneficiary | MSWD',
    breadcrumbs: [
      { label: 'Beneficiaries', url: '/admin/beneficiaries' },
      { label: rows[0].first_name + ' ' + rows[0].last_name, url: '/admin/beneficiaries/' + id },
      { label: 'Edit', url: '' }
    ],
    sectors,
    beneficiary: rows[0],
    formAction: '/admin/beneficiaries/' + id,
    preselected: ''
  });
}

async function updateBeneficiary(req, res) {
  const id = req.params.id;
  const data = req.body;
  delete data._csrf;

  try {
    await query(
      `UPDATE beneficiaries SET
         sector_id = ?, first_name = ?, middle_name = ?, last_name = ?, suffix = ?,
         date_of_birth = ?, sex = ?, civil_status = ?, address = ?, barangay = ?,
         contact_number = ?, email = ?, registration_date = ?, status = ?
       WHERE id = ?`,
      [data.sector_id, data.first_name, data.middle_name || null, data.last_name, data.suffix || null,
       data.date_of_birth || null, data.sex || null, data.civil_status || null, data.address || null,
       data.barangay || null, data.contact_number || null, data.email || null,
       data.registration_date || null, data.status || 'Active', id]
    );

    await logAudit(req.session.user.id, 'beneficiary_update', 'beneficiaries', id, `Updated beneficiary #${id}`, getClientIp(req));
    req.flash('success', 'Beneficiary updated successfully.');
    res.redirect(`/admin/beneficiaries/${id}`);
  } catch (err) {
    console.error('Update beneficiary error:', err.message);
    req.flash('error', 'Failed to update beneficiary.');
    res.redirect(`/admin/beneficiaries/${id}/edit`);
  }
}

async function setBeneficiaryStatus(req, res) {
  const id = req.params.id;
  const { status } = req.body;
  if (!['Active', 'Inactive', 'Archived'].includes(status)) {
    req.flash('error', 'Invalid status.');
    return res.redirect(`/admin/beneficiaries/${id}`);
  }
  await query('UPDATE beneficiaries SET status = ? WHERE id = ?', [status, id]);
  await logAudit(req.session.user.id, 'beneficiary_status', 'beneficiaries', id, `Set beneficiary status to ${status}`, getClientIp(req));
  req.flash('success', `Beneficiary set to ${status}.`);
  res.redirect(`/admin/beneficiaries/${id}`);
}

module.exports = {
  dashboard,
  listAllBeneficiaries,
  newBeneficiaryForm,
  createBeneficiary,
  viewBeneficiary,
  editBeneficiaryForm,
  updateBeneficiary,
  setBeneficiaryStatus
};