const express = require('express');
const router = express.Router();
const { requireGuest } = require('../middleware/auth');
const { getLoginView, postLogin, getRegister, postRegister, logout } = require('../controllers/authController');

router.get('/login', requireGuest, getLoginView);
router.post('/login', requireGuest, postLogin);
router.get('/auth/register', requireGuest, getRegister);
router.post('/auth/register', requireGuest, postRegister);
router.post('/logout', logout);
router.get('/auth/logout', logout);

module.exports = router;