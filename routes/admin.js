const express = require('express');
const router = express.Router();
const c = require('../controllers/adminController');
const upload = require('./multerSetup').upload;
const { csrfVerify } = require('../utils/csrf');

function sectorRoutes(slug) {
  const r = express.Router();
  r.get('/', c.listRecords);
  r.get('/new', c.recordForm);
  r.post('/', c.createRecord);
  r.post('/:rid', c.updateRecord);
  r.get('/:rid', c.viewRecord);
  r.get('/:rid/edit', c.recordForm);
  r.post('/:rid/status', c.setRecordStatus);
  r.post('/:rid/notes', c.postRecordNote);
  r.post('/:rid/followups', c.postRecordFollowup);
  r.post('/:rid/followups/:fid/status', c.setFollowupStatus);
  r.post('/:rid/services', c.postRecordService);
  r.post('/:rid/documents', upload.single('file'), csrfVerify, c.uploadDocument);
  r.post('/:rid/documents/:docId/delete', c.deleteDocument);
  return r;
}

// Dashboard
router.get('/', c.dashboard);

// Beneficiaries
router.get('/beneficiaries', c.listBeneficiaries);
router.get('/beneficiaries/new', c.beneficiaryForm);
router.post('/beneficiaries', c.createBeneficiary);
router.get('/beneficiaries/:id', c.viewBeneficiary);
router.get('/beneficiaries/:id/edit', c.beneficiaryForm);
router.post('/beneficiaries/:id', c.updateBeneficiary);
router.post('/beneficiaries/:id/status', c.setBeneficiaryStatus);
router.post('/beneficiaries/:id/household', c.addHouseholdMember);
router.post('/beneficiaries/:id/household/:mid/delete', c.deleteHouseholdMember);
router.post('/beneficiaries/:id/services', c.postBeneficiaryService);
router.post('/beneficiaries/:id/documents', upload.single('file'), csrfVerify, c.uploadBeneficiaryDocument);
router.post('/beneficiaries/:id/documents/:docId/delete', c.deleteBeneficiaryDocument);

// Officers
router.get('/officers', c.listOfficers);
router.get('/officers/new', c.officerForm);
router.post('/officers', c.createOfficer);
router.get('/officers/:id/edit', c.officerForm);
router.post('/officers/:id', c.updateOfficer);
router.post('/officers/:id/toggle', c.toggleOfficer);
router.post('/officers/:id/reset-password', c.resetOfficerPassword);

// Sectors
router.get('/sectors', c.listSectors);
router.post('/sectors', c.createSector);
router.post('/sectors/:id', c.updateSector);
router.post('/sectors/:id/toggle', c.toggleSector);

// Users / approval requests
router.get('/users', c.listUsers);
router.post('/users/:id/approve', c.approveUser);
router.post('/users/:id/toggle', c.toggleUserActive);

// Sector records — one mounted sub-router per known sector slug.
router.use('/records/:slug', (req, res, next) => {
  const slugs = ['juvenile', 'solo-parent', 'senior-citizens', 'pwd'];
  if (!slugs.includes(req.params.slug)) return res.status(404).render('errors/404', { title: 'Not Found', layout: false });
  next();
});
['juvenile', 'solo-parent', 'senior-citizens', 'pwd'].forEach(slug => {
  router.use('/records/' + slug, (req, res, next) => {
    req.sectorSlug = slug;
    next();
  }, sectorRoutes(slug));
});

// Notifications
router.get('/notifications', c.listNotifications);
router.post('/notifications/read-all', c.markAllNotificationsRead);
router.post('/notifications/:id/read', c.markNotificationRead);

// Services catalog (interventions)
router.get('/services', c.services);
router.post('/services', c.createService);
router.post('/services/:id/toggle', c.toggleService);

// Reports
router.get('/reports', c.reports);
router.get('/reports/monthly', c.monthlyReport);
router.get('/reports/monthly.csv', c.monthlyReportCsv);

// Settings
router.get('/settings', c.settings);
router.post('/settings', c.updateSettings);

// Audit log
router.get('/audit-log', c.auditLog);

module.exports = router;