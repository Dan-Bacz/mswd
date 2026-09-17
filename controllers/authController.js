const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { logAudit } = require('../utils/audit');
const { createNotification, createNotificationToRole } = require('../utils/notify');

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
}

async function getLoginView(req, res) {
  res.render('auth/login', {
    title: 'Login | MSWD Management System',
    layout: 'auth-layout'
  });
}

async function postLogin(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    req.flash('error', 'Username and password are required.');
    return res.redirect('/login');
  }

  try {
    const users = await query(
      `SELECT u.*, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.username = ? OR u.email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      await logAudit(null, 'login_failed', 'auth', null, `Failed login for ${username}`, getClientIp(req));
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/login');
    }

    const user = users[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logAudit(user.id, 'login_failed', 'auth', null, 'Incorrect password', getClientIp(req));
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/login');
    }

    if (!user.is_active || !user.is_approved) {
      await logAudit(user.id, 'login_denied', 'auth', null, 'Account inactive or pending approval', getClientIp(req));
      req.flash('error', 'Your account is inactive or pending approval. Please contact the administrator.');
      return res.redirect('/login');
    }

    let sectorId = null;
    let sectorSlug = null;
    let sectorName = null;
    if (user.role_name === 'officer') {
      const assignments = await query(
        `SELECT s.id AS sector_id, s.slug, s.name
         FROM officer_assignments oa JOIN sectors s ON s.id = oa.sector_id
         WHERE oa.user_id = ? AND oa.is_active = 1`,
        [user.id]
      );
      if (assignments.length > 0) {
        sectorId = assignments[0].sector_id;
        sectorSlug = assignments[0].slug;
        sectorName = assignments[0].name;
      }
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regenerate error:', err.message);
        req.flash('error', 'Could not create session. Try again.');
        return res.redirect('/login');
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        suffix: user.suffix,
        role: user.role_name,
        sector_id: sectorId,
        sector_slug: sectorSlug,
        sector_name: sectorName
      };

      req.session.csrfToken = null;

      bcrypt.compare('x', user.password_hash).catch(() => {});

      logAudit(user.id, 'login', 'auth', null, 'User logged in', getClientIp(req));
      req.flash('success', `Welcome back, ${user.first_name}!`);

      const home = user.role_name === 'admin' ? '/admin' : '/officer';
      res.redirect(home);
    });
  } catch (err) {
    console.error('Login error:', err.message);
    req.flash('error', 'An error occurred during login.');
    res.redirect('/login');
  }
}

async function getRegister(req, res) {
  const sectors = await query('SELECT * FROM sectors WHERE is_active = 1 ORDER BY name');
  res.render('auth/register', {
    title: 'Officer Registration | MSWD Management System',
    layout: 'auth-layout',
    sectors
  });
}

async function postRegister(req, res) {
  const { username, email, password, password2, first_name, middle_name, last_name, suffix, contact_number, sector_id } = req.body;

  if (!username || !email || !password || !first_name || !last_name || !sector_id) {
    req.flash('error', 'Please fill in all required fields.');
    return res.redirect('/auth/register');
  }

  if (password !== password2) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/auth/register');
  }

  if (password.length < 8) {
    req.flash('error', 'Password must be at least 8 characters.');
    return res.redirect('/auth/register');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    req.flash('error', 'Please provide a valid email address.');
    return res.redirect('/auth/register');
  }

  try {
    const existing = await query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      req.flash('error', 'Username or email already exists.');
      return res.redirect('/auth/register');
    }

    const sector = await query('SELECT id FROM sectors WHERE id = ? AND is_active = 1', [sector_id]);
    if (sector.length === 0) {
      req.flash('error', 'Selected sector does not exist.');
      return res.redirect('/auth/register');
    }

    const hash = bcrypt.hashSync(password, 10);
    const officerRole = await query('SELECT id FROM roles WHERE name = ?', ['officer']);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, suffix, contact_number, role_id, is_active, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [username, email, hash, first_name, middle_name || null, last_name, suffix || null, contact_number || null, officerRole[0].id]
    );

    await query(
      'INSERT INTO officer_assignments (user_id, sector_id, is_active) VALUES (?, ?, 1)',
      [result.insertId, sector_id]
    );

    await createNotificationToRole('admin', 'New Officer Registration',
      `${first_name} ${last_name} (${username}) registered as a ${sector.name} officer and is awaiting approval.`,
      'info', '/admin/officers/pending');

    await logAudit(null, 'officer_registration', 'auth', result.insertId, `${first_name} ${last_name} registered for sector`, getClientIp(req));
    req.flash('success', 'Registration submitted! Your account is pending administrator approval.');
    res.redirect('/login');
  } catch (err) {
    console.error('Register error:', err.message);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
}

function logout(req, res) {
  const user = req.session.user;
  if (user) {
    logAudit(user.id, 'logout', 'auth', null, 'User logged out', getClientIp(req));
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err.message);
      res.clearCookie('mswd.sid');
      res.redirect('/login');
    });
  } else {
    res.redirect('/login');
  }
}

module.exports = { getLoginView, postLogin, getRegister, postRegister, logout };