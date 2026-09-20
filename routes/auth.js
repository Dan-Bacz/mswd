const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const auth = require('../controllers/authController');
const { csrfProtection, csrfVerify } = require('../utils/csrf');
const { requireGuest } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).render('errors/429', {
    title: 'Too Many Attempts',
    message: 'Too many sign-in attempts. Please try again in 15 minutes.',
    layout: false
  })
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).render('errors/429', {
    title: 'Too Many Requests',
    message: 'Too many registration attempts from this connection. Please try again later.',
    layout: false
  })
});

router.use(csrfProtection);

router.get('/login', requireGuest, auth.getLoginView);
router.post('/login', loginLimiter, csrfVerify, auth.postLogin);

router.get('/register', requireGuest, auth.getRegisterView);
router.post('/register', registerLimiter, csrfVerify, auth.postRegister);

router.post('/logout', csrfVerify, auth.logout);

module.exports = router;