const express = require('express');
const router = express.Router();
const c = require('../controllers/officerController');
const { requireOfficerAssignment, sectorGuard } = require('../middleware/auth');
const upload = require('./multerSetup').upload;
const { csrfVerify } = require('../utils/csrf');

// The whole officer area requires an active sector assignment.
router.use(requireOfficerAssignment);

router.get('/', c.dashboard);

// Beneficiaries — scoped to the officer's assigned sector.
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

// Cases — implicitly restricted to the assigned sector via req.allowedSector.
router.get('/cases', c.listCases);
router.get('/cases/:rid', c.caseView);
router.post('/cases/:rid/notes', c.postNote);
router.post('/cases/:rid/followups', c.postFollowup);
router.post('/cases/:rid/status', c.changeStatus);
router.post('/cases/:rid/followups/:fid/status', c.setFollowupDone);
router.post('/cases/:rid/services', c.postService);
router.post('/cases/:rid/documents', upload.single('file'), csrfVerify, c.uploadDocument);
router.post('/cases/:rid/documents/:docId/delete', c.deleteDocument);

// Notifications
router.get('/notifications', c.listNotifications);
router.post('/notifications/read-all', c.markAllNotificationsRead);
router.post('/notifications/:id/read', c.markNotificationRead);

// Profile
router.get('/profile', c.profile);
router.post('/profile', c.updateProfile);
router.post('/profile/password', c.changePassword);

// Reports
router.get('/reports', c.reports);
router.get('/reports/monthly', c.monthlyReport);
router.get('/reports/monthly.csv', c.monthlyReportCsv);

module.exports = router;