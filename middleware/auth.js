const { query } = require('../config/database');

function requireLogin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.redirect('/login');
  }
  next();
}

function requireGuest(req, res, next) {
  if (req.session.user && req.session.user.id) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/officer');
  }
  next();
}

// Loads shared app context (sectors, officer assignment, notifications) for the shell layout.
async function loadAppContext(req, res, next) {
  res.locals.allSectors = [];
  res.locals.allowedSector = null;
  res.locals.unreadCount = 0;
  res.locals.latestNotifs = [];

  try {
    if (req.session.user && req.session.user.id) {
      const sectors = await query('SELECT id, name, slug, description FROM sectors WHERE is_active = 1 ORDER BY name');
      res.locals.allSectors = sectors;

      if (req.session.user.role === 'officer') {
        const assign = await query(
          `SELECT oa.sector_id, s.slug, s.name
           FROM officer_assignments oa
           JOIN sectors s ON s.id = oa.sector_id
           WHERE oa.user_id = ? AND oa.is_active = 1 AND s.is_active = 1
           ORDER BY oa.assigned_at DESC LIMIT 1`,
          [req.session.user.id]
        );
        if (assign.length > 0) {
          res.locals.allowedSector = assign[0];
          req.allowedSector = assign[0];
        }
      }

      const unread = await query(
        'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
        [req.session.user.id]
      );
      res.locals.unreadCount = unread[0].c;

      const latest = await query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 8',
        [req.session.user.id]
      );
      res.locals.latestNotifs = latest;
    }
    next();
  } catch (err) {
    console.error('loadAppContext error:', err.message);
    next();
  }
}

// Middleware used on sector-scoped officer routes (e.g. /officer/beneficiaries).
// Verifies the officer's active assignment on every request.
async function requireOfficerAssignment(req, res, next) {
  const user = req.session.user;
  if (!user || user.role !== 'officer') {
    return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Officer access required.', layout: false });
  }
  try {
    if (req.allowedSector) return next();
    const assign = await query(
      `SELECT oa.sector_id, s.slug, s.name
       FROM officer_assignments oa
       JOIN sectors s ON s.id = oa.sector_id
       WHERE oa.user_id = ? AND oa.is_active = 1 AND s.is_active = 1
       ORDER BY oa.assigned_at DESC LIMIT 1`,
      [user.id]
    );
    if (assign.length === 0) {
      return res.status(403).render('errors/403', {
        title: 'Not Assigned',
        message: 'You are not assigned to any sector. Please contact the administrator.',
        layout: false
      });
    }
    req.allowedSector = assign[0];
    res.locals.allowedSector = assign[0];
    return next();
  } catch (err) {
    console.error('requireOfficerAssignment error:', err.message);
    return res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
}

// Guards that a desired sector slug matches the officer's assignment.
function sectorGuard(sectorSlug) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    if (req.allowedSector && req.allowedSector.slug === sectorSlug) return next();
    return res.status(403).render('errors/403', {
      title: 'Access Denied',
      message: 'You are not authorized to access this sector.',
      layout: false
    });
  };
}

module.exports = { requireLogin, requireGuest, loadAppContext, requireOfficerAssignment, sectorGuard };