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
const { logAudit } = require('../utils/audit');
const { markAllRead } = require('../utils/notify');
const { paginate, toInt, fullName } = require('../utils/helpers');
const { getClientIp } = require('../utils/request');

function guard(req, res) {
  if (!req.allowedSector) {
    return res.status(403).render('errors/403', { title: 'Not Assigned', message: 'You are not assigned to any sector.', layout: false });
  }
  return null;
}

exports.dashboard = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  try {
    const slug = req.allowedSector.slug;
    const cfg = recordModel.sectorConfig(slug);
    const data = await dashboardModel.officer(slug);
    const upcoming = await followupModel.upcoming(7);
    res.render('officer/dashboard', {
      slug, cfg, data, upcoming, layout: 'layouts/app', active: 'dashboard'
    });
  } catch (err) {
    console.error('officer dashboard error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

// ---------------------------------------------------------------
// BENEFICIARIES (sector-scoped)
// ---------------------------------------------------------------
exports.listBeneficiaries = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const page = toInt(req.query.page) || 1;
  try {
    const sector = await sectorModel.findBySlug(req.allowedSector.slug);
    const sectorId = sector ? sector.id : null;
    const result = await beneficiaryModel.list({
      sectorId, page, perPage: 15,
      search: req.query.search || '', barangay: req.query.barangay || '', status: req.query.status || 'all'
    });
    const barangays = await beneficiaryModel.barangays();
    res.render('officer/beneficiaries', {
      rows: result.rows, pg: Object.assign({ totalPages: 1 }, result), barangays,
      search: req.query.search || '', barangay: req.query.barangay || '', status: req.query.status || 'all',
      layout: 'layouts/app', active: 'beneficiaries'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.beneficiaryForm = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  try {
    const b = req.params.id ? await beneficiaryModel.findById(req.params.id) : null;
    if (req.params.id && (!b || b.sector_slug !== req.allowedSector.slug)) {
      return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
    }
    const dupMatches = b ? await beneficiaryModel.findDuplicates(b, b.id) : [];
    res.render('officer/beneficiaries-form', { b, dupMatches, layout: 'layouts/app', active: 'beneficiaries' });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.createBeneficiary = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const { first_name, last_name } = req.body;
  if (!first_name || !last_name) {
    req.flash('error', 'First and last name are required.');
    return res.redirect('/officer/beneficiaries/new');
  }
  try {
    const sector = await sectorModel.findBySlug(req.allowedSector.slug);
    const dups = await beneficiaryModel.findDuplicates(req.body);
    const id = await beneficiaryModel.create(Object.assign(req.body, {
      sector_id: sector.id, registered_by: req.session.user.id
    }));
    await logAudit(req.session.user.id, 'create', 'beneficiaries', id, 'Officer registered beneficiary', getClientIp(req));
    if (dups.length) {
      const names = dups.slice(0, 3).map(d => fullName(d)).join(', ');
      req.flash('warning', 'Saved, but it may be a duplicate of: ' + names + (dups.length > 3 ? ' (+' + (dups.length - 3) + ' more)' : '') + '.');
    } else {
      req.flash('success', 'Beneficiary added to ' + req.allowedSector.name + ' sector.');
    }
    res.redirect('/officer/beneficiaries/' + id);
  } catch (err) {
    console.error('officer create beneficiary error:', err.message);
    req.flash('error', 'Could not save beneficiary.');
    res.redirect('/officer/beneficiaries/new');
  }
};

exports.updateBeneficiary = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const id = req.params.id;
  const b = await beneficiaryModel.findById(id);
  if (!b || b.sector_slug !== req.allowedSector.slug) {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
  }
  try {
    // Officers may only update records of their own sector; sector_id is locked.
    const body = Object.assign(req.body, { sector_id: b.sector_id });
    const dups = await beneficiaryModel.findDuplicates(req.body, id);
    await beneficiaryModel.update(id, body);
    await logAudit(req.session.user.id, 'update', 'beneficiaries', id, 'Officer updated beneficiary', getClientIp(req));
    if (dups.length) {
      const names = dups.slice(0, 3).map(d => fullName(d)).join(', ');
      req.flash('warning', 'Saved, but it may be a duplicate of: ' + names + (dups.length > 3 ? ' (+' + (dups.length - 3) + ' more)' : '') + '.');
    } else {
      req.flash('success', 'Beneficiary updated.');
    }
    res.redirect('/officer/beneficiaries/' + id);
  } catch (err) {
    req.flash('error', 'Could not update beneficiary.');
    res.redirect('/officer/beneficiaries/' + id + '/edit');
  }
};

exports.viewBeneficiary = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  try {
    const b = await beneficiaryModel.findById(req.params.id);
    if (!b) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
    if (b.sector_slug !== req.allowedSector.slug) {
      return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
    }
    const notes = await noteModel.listForBeneficiary(b.id, 30);
    const documents = await documentModel.list(b.id);
    const household = await householdModel.list(b.id);
    const provided = await servicesModel.listProvided(b.id);
    const catalog = await servicesModel.listServices({});
    res.render('officer/beneficiaries-view', {
      b, notes, documents, household, provided, catalog, layout: 'layouts/app', active: 'beneficiaries'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.postBeneficiaryService = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const benId = req.params.id;
  const b = await beneficiaryModel.findById(benId);
  if (!b || b.sector_slug !== req.allowedSector.slug) {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
  }
  if (!req.body.service_id) {
    req.flash('error', 'Please choose a service.');
    return res.redirect('/officer/beneficiaries/' + benId);
  }
  try {
    const svc = await servicesModel.findById(req.body.service_id);
    if (!svc) { req.flash('error', 'Service not found.'); return res.redirect('/officer/beneficiaries/' + benId); }
    const csId = await servicesModel.provide(benId, req.body, req.session.user.id);
    await logAudit(req.session.user.id, 'create', 'case_services', csId, 'Officer provided service: ' + svc.name, getClientIp(req));
    req.flash('success', 'Service recorded.');
  } catch (err) {
    console.error('officer beneficiary service error:', err.message);
    req.flash('error', 'Could not record service.');
  }
  res.redirect('/officer/beneficiaries/' + benId);
};

exports.addHouseholdMember = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const benId = req.params.id;
  const b = await beneficiaryModel.findById(benId);
  if (!b || b.sector_slug !== req.allowedSector.slug) {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
  }
  const member_name = (req.body.member_name || '').trim();
  if (!member_name) {
    req.flash('error', 'Household member name is required.');
    return res.redirect('/officer/beneficiaries/' + benId);
  }
  try {
    await householdModel.add(benId, Object.assign(req.body, { member_name }));
    await logAudit(req.session.user.id, 'create', 'beneficiary_household', benId, 'Added household member ' + member_name, getClientIp(req));
    req.flash('success', 'Household member added.');
  } catch (err) {
    console.error('add household error:', err.message);
    req.flash('error', 'Could not add household member.');
  }
  res.redirect('/officer/beneficiaries/' + benId);
};

exports.deleteHouseholdMember = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const benId = req.params.id;
  const b = await beneficiaryModel.findById(benId);
  if (!b || b.sector_slug !== req.allowedSector.slug) {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
  }
  try {
    const member = await householdModel.findById(req.params.mid);
    if (member) await householdModel.remove(member.id);
    await logAudit(req.session.user.id, 'delete', 'beneficiary_household', req.params.mid, 'Removed household member', getClientIp(req));
    req.flash('success', 'Household member removed.');
  } catch (err) {
    req.flash('error', 'Could not remove household member.');
  }
  res.redirect('/officer/beneficiaries/' + benId);
};

exports.uploadBeneficiaryDocument = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const benId = req.params.id;
  const b = await beneficiaryModel.findById(benId);
  if (!b || b.sector_slug !== req.allowedSector.slug) {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
  }
  try {
    if (!req.file) {
      req.flash('error', 'Please attach a file.');
      return res.redirect('/officer/beneficiaries/' + benId);
    }
    await documentModel.create(benId, {
      document_name: (req.body.document_name || '').trim() || req.file.originalname,
      document_type: req.body.document_type,
      file_path: '/uploads/' + req.file.filename,
      file_size: req.file.size,
      notes: req.body.notes
    }, req.session.user.id);
    await logAudit(req.session.user.id, 'upload', 'documents', benId, 'Officer uploaded ' + req.file.originalname, getClientIp(req));
    req.flash('success', 'Document uploaded.');
  } catch (err) {
    req.flash('error', 'Could not upload document.');
  }
  res.redirect('/officer/beneficiaries/' + benId);
};

exports.deleteBeneficiaryDocument = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const benId = req.params.id;
  const b = await beneficiaryModel.findById(benId);
  if (!b || b.sector_slug !== req.allowedSector.slug) {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
  }
  try {
    const doc = await documentModel.findById(req.params.docId);
    if (doc) await documentModel.remove(doc.id);
    req.flash('success', 'Document deleted.');
  } catch (err) {
    req.flash('error', 'Could not delete document.');
  }
  res.redirect('/officer/beneficiaries/' + benId);
};

exports.setBeneficiaryStatus = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const id = req.params.id;
  const status = ['Active', 'Inactive', 'Archived'].includes(req.body.status) ? req.body.status : 'Active';
  const b = await beneficiaryModel.findById(id);
  if (!b || b.sector_slug !== req.allowedSector.slug) {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Not your sector.', layout: false });
  }
  try {
    await beneficiaryModel.setStatus(id, status);
    await logAudit(req.session.user.id, 'update', 'beneficiaries', id, 'Beneficiary status set to ' + status, getClientIp(req));
    req.flash('success', 'Status updated.');
  } catch (err) {
    req.flash('error', 'Could not update status.');
  }
  res.redirect('/officer/beneficiaries/' + id);
};

// ---------------------------------------------------------------
// CASES (sector records)
// ---------------------------------------------------------------
exports.listCases = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const page = toInt(req.query.page) || 1;
  const slug = req.allowedSector.slug;
  try {
    const cfg = recordModel.sectorConfig(slug);
    const result = await recordModel.list(slug, {
      page, perPage: 15, search: req.query.search || '', status: req.query.status || 'all'
    });
    res.render('officer/cases', {
      slug, cfg: recordModel.sectorConfig(slug), rows: result.rows, pg: Object.assign({ totalPages: 1 }, result),
      search: req.query.search || '', status: req.query.status || 'all',
      layout: 'layouts/app', active: 'cases'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.caseView = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  const id = req.params.rid;
  try {
    const rec = await recordModel.findById(slug, id);
    if (!rec) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
    const notes = await noteModel.list(slug, id);
    const followups = await followupModel.list(slug, id);
    const documents = await documentModel.list(rec.beneficiary_id);
    const provided = await servicesModel.listProvided(rec.beneficiary_id);
    const catalog = await servicesModel.listServices({});
    res.render('officer/cases-view', {
      slug, cfg: recordModel.sectorConfig(slug), rec, notes, followups, documents, provided, catalog,
      layout: 'layouts/app', active: 'cases'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.postNote = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  const id = req.params.rid;
  const note = (req.body.note || '').trim();
  if (!note) { req.flash('error', 'Note text is required.'); return res.redirect('/officer/cases/' + id); }
  try {
    const rec = await recordModel.findById(slug, id);
    await noteModel.create(slug, id, rec.beneficiary_id, note, req.session.user.id);
    await logAudit(req.session.user.id, 'create', 'case_notes', id, 'Officer added case note', getClientIp(req));
    req.flash('success', 'Note added.');
  } catch (err) {
    req.flash('error', 'Could not add note.');
  }
  res.redirect('/officer/cases/' + id);
};

exports.postFollowup = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  const id = req.params.rid;
  try {
    const rec = await recordModel.findById(slug, id);
    await followupModel.create(slug, id, rec.beneficiary_id, Object.assign(req.body, { assigned_to: req.session.user.id }));
    await logAudit(req.session.user.id, 'create', 'case_followups', id, 'Officer scheduled follow-up', getClientIp(req));
    req.flash('success', 'Follow-up scheduled.');
  } catch (err) {
    req.flash('error', 'Could not schedule follow-up.');
  }
  res.redirect('/officer/cases/' + id);
};

exports.postService = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  const id = req.params.rid;
  if (!req.body.service_id) {
    req.flash('error', 'Please choose a service.');
    return res.redirect('/officer/cases/' + id);
  }
  try {
    const rec = await recordModel.findById(slug, id);
    if (!rec) { req.flash('error', 'Case not found.'); return res.redirect('/officer/cases'); }
    const svc = await servicesModel.findById(req.body.service_id);
    if (!svc) { req.flash('error', 'Service not found.'); return res.redirect('/officer/cases/' + id); }
    const csId = await servicesModel.provide(rec.beneficiary_id, req.body, req.session.user.id);
    await logAudit(req.session.user.id, 'create', 'case_services', csId, 'Officer provided service: ' + svc.name, getClientIp(req));
    await noteModel.create(slug, id, rec.beneficiary_id, 'Service provided: ' + svc.name + ' (by ' + fullName(req.session.user) + ')', req.session.user.id);
    req.flash('success', 'Service recorded.');
  } catch (err) {
    console.error('officer service error:', err.message);
    req.flash('error', 'Could not record service.');
  }
  res.redirect('/officer/cases/' + id);
};

exports.changeStatus = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  const id = req.params.rid;
  try {
    const cfg = recordModel.sectorConfig(slug);
    if (!cfg.statuses.includes(req.body.status)) {
      req.flash('error', 'Invalid status.');
      return res.redirect('/officer/cases/' + id);
    }
    const rec = await recordModel.findById(slug, id);
    const prev = rec ? rec[cfg.statusColumn] : null;
    await recordModel.setStatus(slug, id, req.body.status);
    await logAudit(req.session.user.id, 'update', 'records', id, 'Officer changed status to ' + req.body.status, getClientIp(req));
    if (rec && prev && prev !== req.body.status) {
      await noteModel.create(slug, id, rec.beneficiary_id, 'Status change: ' + prev + ' → ' + req.body.status + ' (by ' + fullName(req.session.user) + ')', req.session.user.id);
    }
    req.flash('success', 'Status updated.');
  } catch (err) {
    req.flash('error', 'Could not update status.');
  }
  res.redirect('/officer/cases/' + id);
};

exports.setFollowupDone = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  const id = req.params.rid;
  try {
    await followupModel.setStatus(req.body.followup_id, req.body.status, req.body.result || null);
    await logAudit(req.session.user.id, 'update', 'case_followups', id, 'Follow-up marked ' + req.body.status, getClientIp(req));
    req.flash('success', 'Follow-up updated.');
  } catch (err) {
    req.flash('error', 'Could not update follow-up.');
  }
  res.redirect('/officer/cases/' + id);
};

exports.uploadDocument = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  const id = req.params.rid;
  try {
    const rec = await recordModel.findById(slug, id);
    if (!req.file) { req.flash('error', 'Please attach a file.'); return res.redirect('/officer/cases/' + id); }
    const filePath = '/uploads/' + req.file.filename;
    await documentModel.create(rec.beneficiary_id, {
      document_name: (req.body.document_name || '').trim() || req.file.originalname,
      document_type: req.body.document_type,
      file_path: filePath,
      file_size: req.file.size,
      notes: req.body.notes
    }, req.session.user.id);
    await logAudit(req.session.user.id, 'upload', 'documents', null, 'Officer uploaded ' + req.file.originalname, getClientIp(req));
    req.flash('success', 'Document uploaded.');
  } catch (err) {
    req.flash('error', 'Could not upload document.');
  }
  res.redirect('/officer/cases/' + id);
};

exports.deleteDocument = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const id = req.params.rid;
  try {
    const doc = await documentModel.findById(req.params.docId);
    if (doc) await documentModel.remove(doc.id);
    req.flash('success', 'Document deleted.');
  } catch (err) {
    req.flash('error', 'Could not delete document.');
  }
  res.redirect('/officer/cases/' + id);
};

// ---------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------
exports.listNotifications = async (req, res) => {
  const page = toInt(req.query.page) || 1;
  try {
    const { rows, total } = await notificationModel.list(req.session.user.id, page, 15);
    res.render('officer/notifications', {
      rows, pg: Object.assign({ totalPages: 1, total }, { page }), layout: 'layouts/app', active: 'notifications'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await notificationModel.markRead(req.session.user.id, req.params.id);
  } catch (err) {}
  res.redirect(req.body.back || '/officer/notifications');
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await markAllRead(req.session.user.id);
    req.flash('success', 'All notifications marked as read.');
  } catch (err) {}
  res.redirect('/officer/notifications');
};

// ---------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------
exports.profile = async (req, res) => {
  try {
    const me = await userModel.findById(req.session.user.id);
    res.render('officer/profile', { me, layout: 'layouts/app', active: 'profile' });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    await userModel.updateProfile(req.session.user.id, req.body);
    req.session.user.first_name = req.body.first_name;
    req.session.user.last_name = req.body.last_name;
    await logAudit(req.session.user.id, 'update', 'profile', null, 'Updated own profile', getClientIp(req));
    req.flash('success', 'Profile updated.');
  } catch (err) {
    req.flash('error', 'Could not update profile.');
  }
  res.redirect('/officer/profile');
};

exports.changePassword = async (req, res) => {
  try {
    const me = await userModel.findById(req.session.user.id);
    const { current_password, new_password, confirm_password } = req.body;
    if (!(await userModel.compare(current_password, me.password_hash))) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/officer/profile');
    }
    if (String(new_password).length < 8) {
      req.flash('error', 'New password must be at least 8 characters.');
      return res.redirect('/officer/profile');
    }
    if (new_password !== confirm_password) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/officer/profile');
    }
    await userModel.setPassword(req.session.user.id, userModel.hash(new_password, 10));
    await logAudit(req.session.user.id, 'change_password', 'profile', null, 'Changed own password', getClientIp(req));
    req.flash('success', 'Password changed.');
  } catch (err) {
    req.flash('error', 'Could not change password.');
  }
  res.redirect('/officer/profile');
};

// ---------------------------------------------------------------
// REPORTS (sector)
// ---------------------------------------------------------------
exports.reports = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  const slug = req.allowedSector.slug;
  try {
    const { query } = require('../config/database');
    const cfg = recordModel.sectorConfig(slug);
    const sectors = [{ slug, name: req.allowedSector.name, title: cfg.title }];
    const total = await query('SELECT COUNT(*) AS c FROM ' + cfg.table);
    const active = await query(`SELECT COUNT(*) AS c FROM ${cfg.table} WHERE ${cfg.statusColumn} NOT IN ('Inactive','Closed','Expired','Deceased')`);
    const statusRows = await query(`SELECT ${cfg.statusColumn} AS status, COUNT(*) AS c FROM ${cfg.table} GROUP BY ${cfg.statusColumn}`);
    const monthRows = await query(
      "SELECT DATE_FORMAT(b.registration_date, '%Y-%m') AS ym, COUNT(*) AS c FROM beneficiaries b WHERE b.sector_id = (SELECT id FROM sectors WHERE slug = ?) GROUP BY ym",
      [slug]
    );
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      months.push(Number(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    const monthMap = Object.fromEntries(monthRows.map(r => [r.ym, r.c]));
    const monthlyRegistrations = months.map(m => ({ ym: m, label: m.slice(2).replace('-', '/'), c: monthMap[m] || 0 }));
    const upcoming = await followupModel.upcoming(7);

    res.render('officer/reports', {
      perSector: [{ slug, name: req.allowedSector.name, title: cfg.title, total: total[0].c, active: active[0].c }],
      statusRows, monthlyRegistrations, upcoming,
      layout: 'layouts/app', active: 'reports'
    });
  } catch (err) {
    console.error('officer reports error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.monthlyReport = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  try {
    const slug = req.allowedSector.slug;
    const sector = await sectorModel.findBySlug(slug);
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : new Date().toISOString().slice(0, 7);
    const data = await reportModel.monthly(month, { sectorId: sector ? sector.id : null });
    const csvUrl = '/officer/reports/monthly.csv?month=' + data.month;
    res.render('officer/reports-monthly', {
      data, csvUrl, sectorName: req.allowedSector.name,
      title: 'Monthly Accomplishment Report', layout: 'layouts/app', active: 'reports'
    });
  } catch (err) {
    console.error('officer monthly report error:', err.message);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};

exports.monthlyReportCsv = async (req, res) => {
  const g = guard(req, res);
  if (g) return g;
  try {
    const slug = req.allowedSector.slug;
    const sector = await sectorModel.findBySlug(slug);
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : new Date().toISOString().slice(0, 7);
    const data = await reportModel.monthly(month, { sectorId: sector ? sector.id : null });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mswd-monthly-${req.allowedSector.slug}-${data.month}.csv"`);
    res.send('\uFEFF' + reportModel.buildCsv(data));
  } catch (err) {
    console.error('officer monthly csv error:', err.message);
    res.status(500).json({ error: 'Could not generate report' });
  }
};