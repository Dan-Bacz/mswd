const express = require('express');
const router = express.Router();
const { requireAuth, loadNotifications } = require('../middleware/auth');

router.use(requireAuth);
router.use(loadNotifications);

module.exports = router;