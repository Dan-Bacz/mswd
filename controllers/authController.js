const userModel = require('../models/userModel');
const { generateCsrfToken } = require('../utils/csrf');
const { logAudit } = require('../utils/audit');
const { createNotification } = require('../utils/notify');
const { getClientIp } = require('../utils/request');

exports.getLoginView = (req, res) => {
  const token = generateCsrfToken(req);
  res.render('auth/login', {
    title: 'Sign In',
    csrfToken: token,
    error: res.locals.error || req.query.error,
    success: res.locals.success,
    layout: false
  });
};

exports.getRegisterView = (req, res) => {
  const token = generateCsrfToken(req);
  res.render('auth/register', {
    title: 'Create Officer Account',
    csrfToken: token,
    error: res.locals.error,
    layout: false
  });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    req.flash('error', 'Username and password are required.');
    return res.redirect('/login');
  }
  try {
    const user = await userModel.findByLogin(username.trim());
    if (!user || !(await userModel.compare(password, user.password_hash))) {
      await logAudit(null, 'failed_login', 'auth', null, 'Invalid credentials for: ' + username, getClientIp(req));
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/login');
    }
    if (!user.is_active || !user.is_approved) {
      await logAudit(user.id, 'login_blocked', 'auth', user.id, 'Account not active or approved', getClientIp(req));
      req.flash('error', 'Your account is inactive or awaiting approval. Contact the administrator.');
      return res.redirect('/login');
    }

    req.session.regenerate(err => {
      if (err) console.error('session regenerate error', err.message);
      const sessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role_name
      };
      req.session.user = sessionUser;
      req.session.csrfToken = generateCsrfToken(req);
      userModel.touchLastLogin(user.id).catch(() => {});
      logAudit(user.id, 'login', 'auth', user.id, 'Signed in', getClientIp(req));
      createNotification(user.id, 'Welcome back', 'You have signed in to the MSWD system.', 'info', '/notifications').catch(() => {});
      res.redirect(user.role_name === 'admin' ? '/admin' : '/officer');
    });
  } catch (err) {
    console.error('postLogin error:', err.message);
    req.flash('error', 'An unexpected error occurred. Please try again.');
    res.redirect('/login');
  }
};

exports.postRegister = async (req, res) => {
  const {
    username, email, password, confirm_password,
    first_name, middle_name, last_name, suffix, contact_number
  } = req.body;

  const fail = msg => {
    req.flash('error', msg);
    return res.redirect('/register');
  };

  if (!username || !email || !password || !first_name || !last_name) {
    return fail('All required fields must be filled out.');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email address.');
  if (password.length < 8) return fail('Password must be at least 8 characters.');
  if (password !== confirm_password) return fail('Passwords do not match.');

  try {
    const exists = await userModel.findByUsernameOrEmail(username.trim(), email.trim());
    if (exists) return fail('Username or email is already registered.');

    const officerRoleId = await userModel.getRoleId('officer');
    const hash = userModel.hash(password, 10);
    await userModel.create({
      username: username.trim(),
      email: email.trim(),
      password_hash: hash,
      first_name, middle_name, last_name, suffix, contact_number,
      role_id: officerRoleId,
      is_active: 0,
      is_approved: 0
    });
    await logAudit(null, 'officer_registered', 'users', null, 'New officer registration requested: ' + username.trim(), getClientIp(req));
    const admins = await userModel.listUsers('');
    for (const a of admins.filter(u => u.role_name === 'admin')) {
      await createNotification(a.id, 'New registration request', `${first_name} ${last_name} requested an officer account.`, 'warning', '/admin/users?filter=pending');
    }
    req.flash('success', 'Registration successful! An administrator will approve your account.');
    res.redirect('/login');
  } catch (err) {
    console.error('postRegister error:', err.message);
    fail('Registration could not be completed. Please try again.');
  }
};

exports.logout = (req, res) => {
  if (req.session.user) {
    logAudit(req.session.user.id, 'logout', 'auth', null, 'Signed out', getClientIp(req));
  }
  req.session.destroy(() => {
    res.redirect('/login');
  });
};