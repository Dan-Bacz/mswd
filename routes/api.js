const express = require('express');
const router = express.Router();
const c = require('../controllers/apiController');
const { requireLogin } = require('../middleware/authorization');

// All JSON endpoints require an active session.
router.use(requireLogin);

router.get('/notifications/unread-count', c.notificationUnread);
router.post('/notifications/:id/read', c.notificationMarkRead);
router.get('/dashboard/stats', c.dashboardStats);
router.get('/sectors/:slug/stats', c.sectorStats);

module.exports = router;