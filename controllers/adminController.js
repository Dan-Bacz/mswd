const { query } = require('../config/database');
const dashboardModel = require('../models/dashboardModel');
const beneficiaryModel = require('../models/beneficiaryModel');
const sectorModel = require('../models/sectorModel');
const userModel = require('../models/userModel');
const recordModel = require('../models/recordModel');
const noteModel = require('../models/noteModel');
const followupModel = require('../models/followupModel');
const documentModel = require('../models/documentModel');
const householdModel = require('../models/householdModel');
const servicesModel = require('../models/servicesModel');
const reportModel = require('../models/reportModel');
const notificationModel = require('../models/notificationModel');
const auditModel = require('../models/auditModel');
const { logAudit } = require('../utils/audit');
const { createNotification, createNotificationToRole, markAllRead } = require('../utils/notify');
const { paginate, toInt, fullName } = require('../utils/helpers');
const { getClientIp } = require('../utils/request');

const P = (page, req) => ({
  total: 0,
  page: toInt(req.query.page),
  perPage: 15,
  totalPages: 1,
  hasPrev: false,
  hasNext: false
});

// ---------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------
exports.dashboard = async (req, res) => {
  try {
    const data = await dashboardModel.admin();
    res.render('admin/dashboard', { ...data, layout: 'layouts/app', active: 'dashboard' });
  } catch (err) {
    console.error('admin dashboard error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

// ---------------------------------------------------------------
// BENEFICIARIES
// ---------------------------------------------------------------
exports.listBeneficiaries = async (req, res) => {
  const page = toInt(req.query.page) || 1;
  const search = req.query.search || '';
  const barangay = req.query.barangay || '';
  const status = req.query.status || 'all';
  const sectorId = toInt(req.query.sector) || null;
  try {
    const sectors = await sectorModel.listActive();
    const barangays = await beneficiaryModel.barangays();
    const result = await beneficiaryModel.list({ page, perPage: 15, search, barangay, status, sectorId });
    const pg = Object.assign(P(page, req), result);
    pg.total = result.total;
    res.render('admin/beneficiaries', {
      rows: result.rows, pg, sectors, barangays, search, barangay, status, sectorId,
      layout: 'layouts/app', active: 'beneficiaries'
    });
  } catch (err) {
    console.error('list beneficiaries error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.beneficiaryForm = async (req, res) => {
  try {
    const sectors = await sectorModel.listActive();
    const b = req.params.id ? await beneficiaryModel.findById(req.params.id) : null;
    const dupMatches = b ? await beneficiaryModel.findDuplicates(b, b.id) : [];
    res.render('admin/beneficiaries-form', { b, sectors, dupMatches, layout: 'layouts/app', active: 'beneficiaries' });
  } catch (err) {
    console.error('beneficiary form error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.createBeneficiary = async (req, res) => {
  const { first_name, last_name, sector_id } = req.body;
  if (!first_name || !last_name || !sector_id) {
    req.flash('error', 'First name, last name and sector are required.');
    return res.redirect('/admin/beneficiaries/new');
  }
  try {
    const dups = await beneficiaryModel.findDuplicates(req.body);
    const id = await beneficiaryModel.create(Object.assign(req.body, { registered_by: req.session.user.id }));
    await logAudit(req.session.user.id, 'create', 'beneficiaries', id, 'Added beneficiary: ' + first_name + ' ' + last_name, getClientIp(req));
    if (dups.length) {
      const names = dups.slice(0, 3).map(d => fullName(d)).join(', ');
      req.flash('warning', 'Saved, but it may be a duplicate of: ' + names + (dups.length > 3 ? ' (+' + (dups.length - 3) + ' more)' : '') + '.');
    } else {
      req.flash('success', 'Beneficiary registered successfully.');
    }
    res.redirect('/admin/beneficiaries/' + id);
  } catch (err) {
    console.error('create beneficiary error:', err.message);
    req.flash('error', 'Could not save beneficiary (duplicate record or invalid data).');
    res.redirect('/admin/beneficiaries/new');
  }
};

exports.updateBeneficiary = async (req, res) => {
  const id = req.params.id;
  const { first_name, last_name, sector_id } = req.body;
  if (!first_name || !last_name || !sector_id) {
    req.flash('error', 'First name, last name and sector are required.');
    return res.redirect('/admin/beneficiaries/' + id + '/edit');
  }
  try {
    const dups = await beneficiaryModel.findDuplicates(req.body, id);
    await beneficiaryModel.update(id, req.body);
    await logAudit(req.session.user.id, 'update', 'beneficiaries', id, 'Updated beneficiary details', getClientIp(req));
    if (dups.length) {
      const names = dups.slice(0, 3).map(d => fullName(d)).join(', ');
      req.flash('warning', 'Saved, but it may be a duplicate of: ' + names + (dups.length > 3 ? ' (+' + (dups.length - 3) + ' more)' : '') + '.');
    } else {
      req.flash('success', 'Beneficiary updated successfully.');
    }
    res.redirect('/admin/beneficiaries/' + id);
  } catch (err) {
    console.error('update beneficiary error:', err.message);
    req.flash('error', 'Could not update beneficiary.');
    res.redirect('/admin/beneficiaries/' + id + '/edit');
  }
};

exports.viewBeneficiary = async (req, res) => {
  try {
    const b = await beneficiaryModel.findById(req.params.id);
    if (!b) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
    const notes = await noteModel.listForBeneficiary(b.id, 30);
    const documents = await documentModel.list(b.id);
    const household = await householdModel.list(b.id);
    const provided = await servicesModel.listProvided(b.id);
    const catalog = await servicesModel.listServices({});
    res.render('admin/beneficiaries-view', {
      b, notes, documents, household, provided, catalog, layout: 'layouts/app', active: 'beneficiaries'
    });
  } catch (err) {
    console.error('view beneficiary error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.postBeneficiaryService = async (req, res) => {
  const benId = req.params.id;
  if (!req.body.service_id) {
    req.flash('error', 'Please choose a service.');
    return res.redirect('/admin/beneficiaries/' + benId);
  }
  try {
    const b = await beneficiaryModel.findById(benId);
    if (!b) { req.flash('error', 'Beneficiary not found.'); return res.redirect('/admin/beneficiaries'); }
    const svc = await servicesModel.findById(req.body.service_id);
    if (!svc) { req.flash('error', 'Service not found.'); return res.redirect('/admin/beneficiaries/' + benId); }
    const csId = await servicesModel.provide(benId, req.body, req.session.user.id);
    await logAudit(req.session.user.id, 'create', 'case_services', csId, 'Provided service: ' + svc.name, getClientIp(req));
    req.flash('success', 'Service recorded.');
  } catch (err) {
    console.error('beneficiary service error:', err.message);
    req.flash('error', 'Could not record service.');
  }
  res.redirect('/admin/beneficiaries/' + benId);
};

exports.addHouseholdMember = async (req, res) => {
  const benId = req.params.id;
  const member_name = (req.body.member_name || '').trim();
  if (!member_name) {
    req.flash('error', 'Household member name is required.');
    return res.redirect('/admin/beneficiaries/' + benId);
  }
  try {
    const b = await beneficiaryModel.findById(benId);
    if (!b) { req.flash('error', 'Beneficiary not found.'); return res.redirect('/admin/beneficiaries'); }
    await householdModel.add(benId, Object.assign(req.body, { member_name }));
    await logAudit(req.session.user.id, 'create', 'beneficiary_household', benId, 'Added household member ' + member_name, getClientIp(req));
    req.flash('success', 'Household member added.');
  } catch (err) {
    console.error('add household error:', err.message);
    req.flash('error', 'Could not add household member.');
  }
  res.redirect('/admin/beneficiaries/' + benId);
};

exports.deleteHouseholdMember = async (req, res) => {
  const benId = req.params.id;
  try {
    const member = await householdModel.findById(req.params.mid);
    if (member) await householdModel.remove(member.id);
    await logAudit(req.session.user.id, 'delete', 'beneficiary_household', req.params.mid, 'Removed household member', getClientIp(req));
    req.flash('success', 'Household member removed.');
  } catch (err) {
    req.flash('error', 'Could not remove household member.');
  }
  res.redirect('/admin/beneficiaries/' + benId);
};

exports.uploadBeneficiaryDocument = async (req, res) => {
  const benId = req.params.id;
  try {
    const b = await beneficiaryModel.findById(benId);
    if (!b) { req.flash('error', 'Beneficiary not found.'); return res.redirect('/admin/beneficiaries'); }
    if (!req.file) {
      req.flash('error', 'Please attach a file.');
      return res.redirect('/admin/beneficiaries/' + benId);
    }
    const docName = (req.body.document_name || '').trim();
    await documentModel.create(benId, {
      document_name: docName || req.file.originalname,
      document_type: req.body.document_type,
      file_path: '/uploads/' + req.file.filename,
      file_size: req.file.size,
      notes: req.body.notes
    }, req.session.user.id);
    await logAudit(req.session.user.id, 'upload', 'documents', benId, 'Uploaded ' + req.file.originalname, getClientIp(req));
    req.flash('success', 'Document uploaded.');
  } catch (err) {
    console.error('upload beneficiary doc error:', err.message);
    req.flash('error', 'Could not upload document.');
  }
  res.redirect('/admin/beneficiaries/' + benId);
};

exports.deleteBeneficiaryDocument = async (req, res) => {
  const benId = req.params.id;
  try {
    const doc = await documentModel.findById(req.params.docId);
    if (doc) await documentModel.remove(doc.id);
    await logAudit(req.session.user.id, 'delete', 'documents', req.params.docId, 'Deleted document', getClientIp(req));
    req.flash('success', 'Document deleted.');
  } catch (err) {
    req.flash('error', 'Could not delete document.');
  }
  res.redirect('/admin/beneficiaries/' + benId);
};

exports.setBeneficiaryStatus = async (req, res) => {
  const id = req.params.id;
  const status = req.body.status === 'Active' ? 'Active' : (req.body.status === 'Inactive' ? 'Inactive' : 'Archived');
  try {
    await beneficiaryModel.setStatus(id, status);
    await logAudit(req.session.user.id, 'update', 'beneficiaries', id, 'Beneficiary status set to ' + status, getClientIp(req));
    req.flash('success', 'Beneficiary status updated.');
  } catch (err) {
    req.flash('error', 'Could not update status.');
  }
  res.redirect('/admin/beneficiaries/' + id);
};

// ---------------------------------------------------------------
// OFFICERS
// ---------------------------------------------------------------
exports.listOfficers = async (req, res) => {
  try {
    const officers = await userModel.listOfficers();
    const sectors = await sectorModel.listActive();
    res.render('admin/officers', { officers, sectors, layout: 'layouts/app', active: 'officers' });
  } catch (err) {
    console.error('list officers error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.officerForm = async (req, res) => {
  try {
    const sectors = await sectorModel.listActive();
    const officer = req.params.id ? await userModel.findOfficerById(req.params.id) : null;
    if (req.params.id && !officer) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
    res.render('admin/officers-form', { officer, sectors, layout: 'layouts/app', active: 'officers' });
  } catch (err) {
    console.error('officer form error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.createOfficer = async (req, res) => {
  const { username, email, first_name, last_name, password, sector_id } = req.body;
  if (!username || !email || !first_name || !last_name || !password || !sector_id) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/admin/officers/new');
  }
  try {
    const exists = await userModel.findByUsernameOrEmail(username.trim(), email.trim());
    if (exists) {
      req.flash('error', 'Username or email already exists.');
      return res.redirect('/admin/officers/new');
    }
    const officerRoleId = await userModel.getRoleId('officer');
    const id = await userModel.create({
      username: username.trim(), email: email.trim(), password_hash: userModel.hash(password, 10),
      first_name, middle_name: req.body.middle_name, last_name, suffix: req.body.suffix,
      contact_number: req.body.contact_number, role_id: officerRoleId, is_active: 1, is_approved: 1
    });
    await query('UPDATE officer_assignments SET is_active = 0 WHERE user_id = ?', [id]);
    await query(
      'INSERT INTO officer_assignments (user_id, sector_id, assigned_by, is_active) VALUES (?, ?, ?, 1)',
      [id, sector_id, req.session.user.id]
    );
    await logAudit(req.session.user.id, 'create', 'officers', id, 'Created officer ' + first_name + ' ' + last_name, getClientIp(req));
    await createNotification(id, 'Account approved', 'Your officer account was created. You can now sign in.', 'success', '/login');
    req.flash('success', 'Officer created and assigned to sector.');
    res.redirect('/admin/officers');
  } catch (err) {
    console.error('create officer error:', err.message);
    req.flash('error', 'Could not create officer.');
    res.redirect('/admin/officers/new');
  }
};

exports.updateOfficer = async (req, res) => {
  const id = req.params.id;
  const { sector_id } = req.body;
  try {
    await userModel.updateProfile(id, req.body);
    if (sector_id) {
      await query('UPDATE officer_assignments SET is_active = 0 WHERE user_id = ?', [id]);
      await query(
        'INSERT INTO officer_assignments (user_id, sector_id, assigned_by, is_active) VALUES (?, ?, ?, 1)',
        [id, sector_id, req.session.user.id]
      );
    }
    await logAudit(req.session.user.id, 'update', 'officers', id, 'Updated officer', getClientIp(req));
    req.flash('success', 'Officer updated.');
    res.redirect('/admin/officers');
  } catch (err) {
    console.error('update officer error:', err.message);
    req.flash('error', 'Could not update officer.');
    res.redirect('/admin/officers/' + id + '/edit');
  }
};

exports.toggleOfficer = async (req, res) => {
  const id = req.params.id;
  try {
    const officer = await userModel.findOfficerById(id);
    if (officer) {
      await userModel.setActive(id, !officer.is_active);
      await logAudit(req.session.user.id, 'update', 'officers', id, 'Officer ' + (officer.is_active ? 'deactivated' : 'activated'), getClientIp(req));
    }
    req.flash('success', 'Officer status updated.');
  } catch (err) {
    req.flash('error', 'Could not update officer.');
  }
  res.redirect('/admin/officers');
};

exports.resetOfficerPassword = async (req, res) => {
  const id = req.params.id;
  const { password } = req.body;
  if (!password || String(password).length < 8) {
    req.flash('error', 'Password must be at least 8 characters.');
    return res.redirect('/admin/officers');
  }
  try {
    await userModel.setPassword(id, userModel.hash(String(password), 10));
    await logAudit(req.session.user.id, 'reset_password', 'officers', id, 'Officer password reset', getClientIp(req));
    await createNotification(id, 'Password updated', 'An administrator reset your password.', 'warning', '/');
    req.flash('success', 'Password reset successfully.');
  } catch (err) {
    req.flash('error', 'Could not reset password.');
  }
  res.redirect('/admin/officers');
};

// ---------------------------------------------------------------
// SECTORS
// ---------------------------------------------------------------
exports.listSectors = async (req, res) => {
  try {
    const sectors = await sectorModel.listAll();
    const withCounts = await Promise.all(sectors.map(async s => ({
      ...s,
      beneficiaryCount: await sectorModel.countBeneficiaries(s.id)
    })));
    res.render('admin/sectors', { sectors: withCounts, layout: 'layouts/app', active: 'sectors' });
  } catch (err) {
    console.error('list sectors error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.createSector = async (req, res) => {
  const { name, slug, description } = req.body;
  if (!name || !slug) {
    req.flash('error', 'Name and slug are required.');
    return res.redirect('/admin/sectors');
  }
  try {
    const id = await sectorModel.create({
      name, slug: String(slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''),
      description
    });
    await logAudit(req.session.user.id, 'create', 'sectors', id, 'Added sector ' + name, getClientIp(req));
    req.flash('success', 'Sector added.');
  } catch (err) {
    req.flash('error', 'Sector slug already exists.');
  }
  res.redirect('/admin/sectors');
};

exports.updateSector = async (req, res) => {
  const id = req.params.id;
  try {
    await sectorModel.update(id, req.body);
    await logAudit(req.session.user.id, 'update', 'sectors', id, 'Updated sector', getClientIp(req));
    req.flash('success', 'Sector updated.');
  } catch (err) {
    req.flash('error', 'Could not update sector.');
  }
  res.redirect('/admin/sectors');
};

exports.toggleSector = async (req, res) => {
  const id = req.params.id;
  try {
    const s = await sectorModel.findById(id);
    if (s) await sectorModel.setActive(id, !s.is_active);
    req.flash('success', 'Sector status updated.');
  } catch (err) {
    req.flash('error', 'Could not update sector.');
  }
  res.redirect('/admin/sectors');
};

// ---------------------------------------------------------------
// USERS / APPROVAL REQUESTS
// ---------------------------------------------------------------
exports.listUsers = async (req, res) => {
  const filter = req.query.filter || 'all';
  try {
    const users = await userModel.listUsers(filter);
    res.render('admin/users', { users, filter, layout: 'layouts/app', active: filter === 'pending' ? 'requests' : 'users' });
  } catch (err) {
    console.error('list users error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.approveUser = async (req, res) => {
  const id = req.params.id;
  try {
    await userModel.setApproval(id, true);
    await logAudit(req.session.user.id, 'approve', 'users', id, 'Approved user account', getClientIp(req));
    await createNotification(id, 'Account approved', 'Your account has been approved. You may now sign in.', 'success', '/login');
    req.flash('success', 'User approved.');
  } catch (err) {
    req.flash('error', 'Could not approve user.');
  }
  res.redirect('/admin/users?filter=pending');
};

exports.toggleUserActive = async (req, res) => {
  const id = req.params.id;
  try {
    const u = await userModel.findById(id);
    if (u) await userModel.setActive(id, !u.is_active);
    await logAudit(req.session.user.id, 'update', 'users', id, 'User ' + (u && u.is_active ? 'deactivated' : 'activated'), getClientIp(req));
    req.flash('success', 'User status updated.');
  } catch (err) {
    req.flash('error', 'Could not update user.');
  }
  res.redirect(req.body.back || '/admin/users');
};

// ---------------------------------------------------------------
// SECTOR RECORDS (CASES)
// ---------------------------------------------------------------
async function makeSectorViewData(slug) {
  const cfg = recordModel.sectorConfig(slug);
  const sector = await sectorModel.findBySlug(slug);
  const beneficiaries = await beneficiaryModel.list({ sectorId: sector ? sector.id : null, perPage: 500, status: 'all' });
  const officers = sector ? await userModel.officersForSector(sector.id) : [];
  return { cfg, sector, beneficiaries: beneficiaries.rows, officers };
}

exports.listRecords = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  if (!recordModel.sectorConfig(slug)) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
  const page = toInt(req.query.page) || 1;
  const search = req.query.search || '';
  const status = req.query.status || 'all';
  try {
    const result = await recordModel.list(slug, { page, perPage: 15, search, status });
    const { cfg } = await makeSectorViewData(slug);
    const pg = Object.assign({ totalPages: 1 }, result);
    res.render('admin/records', {
      slug, cfg: recordModel.sectorConfig(slug), rows: result.rows, pg, search, status,
      layout: 'layouts/app', active: 'records'
    });
  } catch (err) {
    console.error('list records error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.recordForm = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  if (!recordModel.sectorConfig(slug)) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
  try {
    const { cfg, sector, beneficiaries, officers } = await makeSectorViewData(slug);
    const rec = req.params.rid ? await recordModel.findById(slug, req.params.rid) : null;
    if (req.params.rid && !rec) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
    res.render('admin/records-form', {
      slug, cfg, sector, beneficiaries, officers, rec, chosenBeneficiaryId: req.query.beneficiary || (rec && rec.beneficiary_id) || '',
      layout: 'layouts/app', active: 'records'
    });
  } catch (err) {
    console.error('record form error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.createRecord = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const cfg = recordModel.sectorConfig(slug);
  if (!cfg) {
    req.flash('error', 'Unknown sector.');
    return res.redirect('/admin/records');
  }
  if (!req.body.beneficiary_id) {
    req.flash('error', 'A beneficiary must be linked to the record.');
    return res.redirect('/admin/records/' + slug + '/new');
  }
  try {
    const id = await recordModel.create(slug, req.body);
    await logAudit(req.session.user.id, 'create', 'records', id, cfg.item + ' created (' + slug + ')', getClientIp(req));
    const assigned = req.body.assigned_officer_id;
    if (assigned) {
      await createNotification(assigned, 'New case assigned', 'A new ' + cfg.item.toLowerCase() + ' was assigned to you.', 'info', '/officer/cases');
    }
    req.flash('success', cfg.item + ' created.');
    res.redirect('/admin/records/' + slug + '/' + id);
  } catch (err) {
    console.error('create record error:', err.message);
    req.flash('error', 'Could not create record.');
    res.redirect('/admin/records/' + slug + '/new');
  }
};

exports.updateRecord = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  const cfg = recordModel.sectorConfig(slug);
  try {
    await recordModel.update(slug, id, req.body);
    await logAudit(req.session.user.id, 'update', 'records', id, 'Updated ' + cfg.item, getClientIp(req));
    req.flash('success', cfg.item + ' updated.');
  } catch (err) {
    req.flash('error', 'Could not update record.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

exports.viewRecord = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const cfg = recordModel.sectorConfig(slug);
  if (!cfg) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
  try {
    const rec = await recordModel.findById(slug, req.params.rid);
    if (!rec) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
    const notes = await noteModel.list(slug, rec.id);
    const followups = await followupModel.list(slug, rec.id);
    const documents = await documentModel.list(rec.beneficiary_id);
    const provided = await servicesModel.listProvided(rec.beneficiary_id);
    const sector = await sectorModel.findBySlug(slug);
    const catalog = await servicesModel.listServices({ sectorId: sector ? sector.id : null });
    const beneficiaries = await beneficiaryModel.list({ sectorId: sector ? sector.id : null, perPage: 500, status: 'all' });
    const officers = await userModel.officersForSector(sector ? sector.id : null);
    res.render('admin/records-view', {
      slug, cfg, rec, notes, followups, documents, provided, catalog, beneficiaries: beneficiaries.rows, officers,
      layout: 'layouts/app', active: 'records'
    });
  } catch (err) {
    console.error('view record error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.setRecordStatus = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  try {
    const cfg = recordModel.sectorConfig(slug);
    const status = req.body.status;
    if (!cfg.statuses.includes(status)) {
      req.flash('error', 'Invalid status.');
      return res.redirect('/admin/records/' + slug + '/' + id);
    }
    const rec = await recordModel.findById(slug, id);
    const prev = rec ? rec[cfg.statusColumn] : null;
    await recordModel.setStatus(slug, id, status);
    await logAudit(req.session.user.id, 'update', 'records', id, 'Status set to ' + status + ' (' + slug + ')', getClientIp(req));
    if (rec && prev && prev !== status) {
      await noteModel.create(slug, id, rec.beneficiary_id, 'Status change: ' + prev + ' → ' + status + ' (by ' + fullName(req.session.user) + ')', req.session.user.id);
    }
    if (status === 'Closed') {
      await query(`UPDATE ${cfg.table} SET date_closed = COALESCE(date_closed, CURDATE()) WHERE id = ?`, [id]);
    }
    req.flash('success', 'Status updated.');
  } catch (err) {
    req.flash('error', 'Could not update status.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

exports.postRecordNote = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  const note = (req.body.note || '').trim();
  if (!note) {
    req.flash('error', 'Note text is required.');
    return res.redirect('/admin/records/' + slug + '/' + id);
  }
  try {
    const rec = await recordModel.findById(slug, id);
    await noteModel.create(slug, id, rec.beneficiary_id, note, req.session.user.id);
    await logAudit(req.session.user.id, 'create', 'case_notes', id, 'Added case note', getClientIp(req));
    req.flash('success', 'Note added.');
  } catch (err) {
    req.flash('error', 'Could not add note.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

exports.postRecordFollowup = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  try {
    const rec = await recordModel.findById(slug, id);
    await followupModel.create(slug, id, rec.beneficiary_id, req.body);
    await logAudit(req.session.user.id, 'create', 'case_followups', id, 'Scheduled follow-up', getClientIp(req));
    req.flash('success', 'Follow-up scheduled.');
  } catch (err) {
    req.flash('error', 'Could not schedule follow-up.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

exports.postRecordService = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  if (!req.body.service_id) {
    req.flash('error', 'Please choose a service.');
    return res.redirect('/admin/records/' + slug + '/' + id);
  }
  try {
    const rec = await recordModel.findById(slug, id);
    if (!rec) { req.flash('error', 'Record not found.'); return res.redirect('/admin/records'); }
    const svc = await servicesModel.findById(req.body.service_id);
    if (!svc) { req.flash('error', 'Service not found.'); return res.redirect('/admin/records/' + slug + '/' + id); }
    const csId = await servicesModel.provide(rec.beneficiary_id, req.body, req.session.user.id);
    await logAudit(req.session.user.id, 'create', 'case_services', csId, 'Provided service: ' + svc.name, getClientIp(req));
    await noteModel.create(slug, id, rec.beneficiary_id, 'Service provided: ' + svc.name + ' (by ' + fullName(req.session.user) + ')', req.session.user.id);
    req.flash('success', 'Service recorded.');
  } catch (err) {
    console.error('record service error:', err.message);
    req.flash('error', 'Could not record service.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

exports.setFollowupStatus = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  try {
    await followupModel.setStatus(req.body.followup_id, req.body.status, req.body.result || null);
    await logAudit(req.session.user.id, 'update', 'case_followups', id, 'Follow-up marked ' + req.body.status, getClientIp(req));
    req.flash('success', 'Follow-up updated.');
  } catch (err) {
    req.flash('error', 'Could not update follow-up.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

exports.uploadDocument = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  try {
    const rec = await recordModel.findById(slug, id);
    if (!rec) { req.flash('error', 'Record not found.'); return res.redirect('/admin/records'); }
    const docName = (req.body.document_name || '').trim();
    if (!req.file) {
      req.flash('error', 'Please attach a file.');
      return res.redirect('/admin/records/' + slug + '/' + id);
    }
    const filePath = '/uploads/' + req.file.filename;
    await documentModel.create(rec.beneficiary_id, {
      document_name: docName || req.file.originalname,
      document_type: req.body.document_type,
      file_path: filePath,
      file_size: req.file.size,
      notes: req.body.notes
    }, req.session.user.id);
    await logAudit(req.session.user.id, 'upload', 'documents', null, 'Uploaded ' + req.file.originalname, getClientIp(req));
    req.flash('success', 'Document uploaded.');
  } catch (err) {
    console.error('upload doc error:', err.message);
    req.flash('error', 'Could not upload document.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

exports.deleteDocument = async (req, res) => {
  const slug = req.sectorSlug || req.params.slug;
  const id = req.params.rid;
  try {
    const doc = await documentModel.findById(req.params.docId);
    if (doc) await documentModel.remove(doc.id);
    await logAudit(req.session.user.id, 'delete', 'documents', req.params.docId, 'Deleted document', getClientIp(req));
    req.flash('success', 'Document deleted.');
  } catch (err) {
    req.flash('error', 'Could not delete document.');
  }
  res.redirect('/admin/records/' + slug + '/' + id);
};

// ---------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------
exports.listNotifications = async (req, res) => {
  const page = toInt(req.query.page) || 1;
  try {
    const { rows, total } = await notificationModel.list(req.session.user.id, page, 15);
    const pg = Object.assign(P(page, req), { total });
    res.render('admin/notifications', { rows, pg, layout: 'layouts/app', active: 'notifications' });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await notificationModel.markRead(req.session.user.id, req.params.id);
  } catch (err) {}
  res.redirect(req.body.back || '/admin/notifications');
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await markAllRead(req.session.user.id);
    req.flash('success', 'All notifications marked as read.');
  } catch (err) {}
  res.redirect('/admin/notifications');
};

// ---------------------------------------------------------------
// SERVICES (INTERVENTIONS) CATALOG
// ---------------------------------------------------------------
exports.services = async (req, res) => {
  try {
    const sectors = await sectorModel.listAll();
    const services = await servicesModel.listServices({ includeInactive: true });
    res.render('admin/services', { sectors, services, layout: 'layouts/app', active: 'services' });
  } catch (err) {
    console.error('list services error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.createService = async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) {
    req.flash('error', 'Service name is required.');
    return res.redirect('/admin/services');
  }
  try {
    const id = await servicesModel.create(req.body);
    await logAudit(req.session.user.id, 'create', 'services', id, 'Added service: ' + name, getClientIp(req));
    req.flash('success', 'Service added.');
  } catch (err) {
    console.error('create service error:', err.message);
    req.flash('error', 'Could not add service.');
  }
  res.redirect('/admin/services');
};

exports.toggleService = async (req, res) => {
  const id = req.params.id;
  try {
    const svc = await servicesModel.findById(id);
    if (svc) await servicesModel.setActive(id, !svc.is_active);
    await logAudit(req.session.user.id, 'update', 'services', id, 'Service marked ' + (svc && svc.is_active ? 'inactive' : 'active'), getClientIp(req));
    req.flash('success', 'Service status updated.');
  } catch (err) {
    req.flash('error', 'Could not update service.');
  }
  res.redirect('/admin/services');
};

// ---------------------------------------------------------------
// REPORTS
// ---------------------------------------------------------------
exports.reports = async (req, res) => {
  try {
    const sectors = await sectorModel.listActive();
    const perSector = [];
    for (const s of sectors) {
      const cfg = recordModel.sectorConfig(s.slug);
      if (!cfg) continue;
      const total = await query(`SELECT COUNT(*) AS c FROM ${cfg.table}`);
      const active = await query(
        `SELECT COUNT(*) AS c FROM ${cfg.table} WHERE ${cfg.statusColumn} NOT IN ('Inactive','Closed','Expired','Deceased')`
      );
      perSector.push({ slug: s.slug, name: s.name, title: cfg.title, total: total[0].c, active: active[0].c });
    }

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push(Number(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    const regRows = await query(
      "SELECT DATE_FORMAT(registration_date, '%Y-%m') AS ym, COUNT(*) AS c FROM beneficiaries GROUP BY ym"
    );
    const monthMap = Object.fromEntries(regRows.map(r => [r.ym, r.c]));
    const monthlyRegistrations = months.map(m => ({ ym: m, label: m.slice(2).replace('-', '/'), c: monthMap[m] || 0 }));

    const genderRows = await query("SELECT sex, COUNT(*) AS c FROM beneficiaries GROUP BY sex");
    const barangayRows = await query(
      "SELECT barangay, COUNT(*) AS c FROM beneficiaries WHERE barangay IS NOT NULL AND barangay != '' GROUP BY barangay ORDER BY c DESC LIMIT 8"
    );

    const officerWorkload = [];
    const officers = await userModel.listOfficers();
    for (const o of officers) {
      let total = 0;
      for (const slug of Object.keys(recordModel.SECTOR_CONFIG)) {
        const cfg = recordModel.SECTOR_CONFIG[slug];
        const rows = await query('SELECT COUNT(*) AS c FROM ' + cfg.table + ' WHERE assigned_officer_id = ?', [o.id]);
        total += rows[0].c;
      }
      officerWorkload.push({ id: o.id, name: (o.first_name + ' ' + o.last_name).trim(), sector: o.sector_name || '—', total });
    }
    officerWorkload.sort((a, b) => b.total - a.total);

    const upcoming = await followupModel.upcoming(7);

    res.render('admin/reports', {
      perSector, monthlyRegistrations, genderRows, barangayRows, officerWorkload, upcoming,
      layout: 'layouts/app', active: 'reports'
    });
  } catch (err) {
    console.error('reports error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.monthlyReport = async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : new Date().toISOString().slice(0, 7);
    const data = await reportModel.monthly(month);
    const csvUrl = '/admin/reports/monthly.csv?month=' + data.month;
    res.render('admin/reports-monthly', {
      data, csvUrl, title: 'Monthly Accomplishment Report',
      layout: 'layouts/app', active: 'reports'
    });
  } catch (err) {
    console.error('monthly report error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.monthlyReportCsv = async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : new Date().toISOString().slice(0, 7);
    const data = await reportModel.monthly(month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mswd-monthly-${data.month}.csv"`);
    res.send('\uFEFF' + reportModel.buildCsv(data));
  } catch (err) {
    console.error('monthly csv error:', err.message);
    res.status(500).json({ error: 'Could not generate report' });
  }
};

// ---------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------
exports.settings = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM system_settings ORDER BY setting_key');
    const settings = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
    res.render('admin/settings', { settings, layout: 'layouts/app', active: 'settings' });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.updateSettings = async (req, res) => {
  const keys = ['system_name', 'municipality', 'contact_email', 'contact_phone'];
  try {
    for (const key of keys) {
      if (req.body[key] !== undefined) {
        await query(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          [key, String(req.body[key])]
        );
      }
    }
    await logAudit(req.session.user.id, 'update', 'settings', null, 'Updated system settings', getClientIp(req));
    req.flash('success', 'Settings saved.');
  } catch (err) {
    req.flash('error', 'Could not save settings.');
  }
  res.redirect('/admin/settings');
};

// ---------------------------------------------------------------
// AUDIT LOG
// ---------------------------------------------------------------
exports.auditLog = async (req, res) => {
  const page = toInt(req.query.page) || 1;
  try {
    const { rows, total } = await auditModel.list({ action: req.query.action || '', user: req.query.user || '', page, perPage: 20 });
    const actions = await query('SELECT DISTINCT action FROM audit_logs ORDER BY action');
    const pg = Object.assign(P(page, req), { total });
    res.render('admin/audit-log', {
      rows, pg, actions: actions.map(a => a.action), filterAction: req.query.action || '', filterUser: req.query.user || '',
      layout: 'layouts/app', active: 'audit'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};