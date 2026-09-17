const path = require('path');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const methodOverride = require('method-override');
const dotenv = require('dotenv');

dotenv.config();

const { testConnection } = require('./config/database');
const { csrfProtection, csrfVerify, generateCsrfToken } = require('./utils/csrf');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const officerRoutes = require('./routes/officer');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mswd-insecure-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  name: 'mswd.sid',
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

app.use(flash());
app.use(csrfProtection);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many login attempts, please try again later.' }
});

app.use((req, res, next) => {
  res.locals.csrfToken = () => generateCsrfToken(req);
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flashMessages = {
    success: req.flash('success'),
    error: req.flash('error'),
    warning: req.flash('warning'),
    info: req.flash('info')
  };
  next();
});

app.use('/login', loginLimiter);

app.use('/', authRoutes);
app.use('/admin', csrfVerify, adminRoutes);
app.use('/officer', csrfVerify, officerRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/officer');
  }
  res.redirect('/login');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err.message);
    res.clearCookie('mswd.sid');
    res.redirect('/login');
  });
});

app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err);
  res.status(500).render('errors/500', { title: 'Server Error' });
});

async function startServer() {
  try {
    const ok = await testConnection();
    if (!ok) {
      console.error('Could not connect to MySQL. Check DB configuration.');
      process.exit(1);
    }
    console.log('MySQL connection verified.');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`MSWD Management System running on port ${PORT} (${NODE_ENV})`);
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Make sure DB_HOST, DB_NAME, DB_USER, DB_PASSWORD are correct in .env');
    process.exit(1);
  }
}

startServer();