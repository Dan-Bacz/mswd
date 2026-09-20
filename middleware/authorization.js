const { query } = require('../config/database');

function requireLogin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.redirect('/login');
  }
  next();
}

// Enforces ADMIN-only access. Officers (or guests) attempting /admin/* get redirected (guests) or 403.
async function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('errors/403', {
      title: 'Access Denied',
      message: 'This area is restricted to administrators.',
      layout: false
    });
  }
  next();
}

// Must render an admin-only page with the app shell layout.
function adminPageRender(req, res, view, data) {
  res.render(view, Object.assign({ layout: 'layouts/app', active: data.active || '' }, data));
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user || !req.session.user.id) return res.redirect('/login');
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: 'You do not have permission to access this area.',
        layout: false
      });
    }
    next();
  };
}

// Returns the officer's active sector context (admin is handled by callers).
async function getOfficerSector(userId) {
  const rows = await query(
    `SELECT oa.sector_id, s.slug, s.name
     FROM officer_assignments oa
     JOIN sectors s ON s.id = oa.sector_id
     WHERE oa.user_id = ? AND oa.is_active = 1 AND s.is_active = 1
     ORDER BY oa.assigned_at DESC LIMIT 1`,
    [userId]
  );
  return rows.length ? rows[0] : null;
}

module.exports = { requireLogin, requireAdmin, requireRole, getOfficerSector, adminPageRender };