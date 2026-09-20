require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');

const { query } = require('./config/database');
const { generateCsrfToken } = require('./utils/csrf');
const { requireLogin, requireAdmin } = require('./middleware/authorization');
const { loadAppContext } = require('./middleware/auth');
const { csrfVerify } = require('./utils/csrf');
const helpers = require('./utils/helpers');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const officerRoutes = require('./routes/officer');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// -- Views ---------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/app');
app.set('view cache', false); // template changes always apply on the next request
app.use(expressLayouts);

// -- Security -------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// -- Body parsing ----------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// -- Static ----------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
const uploadsDir = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// -- Sessions ---------------------------------------------------------------
app.use(session({
  secret: process.env.SESSION_SECRET || '403bf0e06ff5a6c7b63793b3ea15582baa640905d31ea2696d6cadc2f8354eac',
  resave: false,
  saveUninitialized: false,
  name: 'mswd.sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // production sits behind a proxy that terminates TLS; set secure when served directly over HTTPS
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(flash());

// -- Shared view locals ------------------------------------------------------
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  res.locals.csrfToken = generateCsrfToken(req);
  const success = req.flash('success');
  const error = req.flash('error');
  res.locals.success = success && success.length ? success[0] : null;
  res.locals.error = error && error.length ? error[0] : null;
  res.locals.systemName = process.env.SYSTEM_NAME || 'MSWD Information System';
  res.locals.municipality = process.env.MUNICIPALITY || 'Mahayag, Zamboanga del Sur';
  res.locals.h = helpers;
  next();
});

// -- Routes -----------------------------------------------------------------
app.use('/', authRoutes);

app.use('/admin', requireAdmin, loadAppContext, csrfVerify, adminRoutes);
app.use('/officer', requireLogin, loadAppContext, csrfVerify, officerRoutes);
app.use('/api', apiRoutes);

// -- 404 ----------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page Not Found', layout: false });
});

// -- Error handler ---------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
  res.status(500).render('errors/500', { title: 'Server Error', layout: false });
});

// -- Boot -----------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  query('SELECT 1')
    .then(() => console.log('Database connection: OK'))
    .catch(err => console.warn('Database connection failed: Make sure DB_HOST, DB_NAME, DB_USER, DB_PASSWORD are correct in .env (' + err.code + ')'));
});

module.exports = app;