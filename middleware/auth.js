const { query } = require('../config/database');

function requireAuth(req, res, next) {
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

async function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('errors/403', {
      title: 'Access Denied',
      message: 'You do not have permission to access this area.'
    });
  }
  next();
}

async function loadSectorContext(req, res, next) {
  try {
    const sectors = await query('SELECT * FROM sectors WHERE is_active = 1 ORDER BY name');
    res.locals.allSectors = sectors;
    for (const s of sectors) {
      res.locals[`sector_${s.slug}`] = s;
      res.locals[`sectorId_${s.slug}`] = s.id;
    }
    next();
  } catch (err) {
    console.error('loadSectorContext error:', err.message);
    next();
  }
}

async function requireOfficerSector(req, res, next) {
  const sectorSlug = req.params.sector || req.body.sector || null;
  if (!sectorSlug) {
    return res.redirect('/officer');
  }

  const user = req.session.user;
  if (!user || user.role !== 'officer') {
    return res.redirect('/login');
  }

  try {
    const assignment = await query(
      `SELECT oa.id, oa.sector_id, s.slug, s.name, oa.is_active
       FROM officer_assignments oa
       JOIN sectors s ON s.id = oa.sector_id
       WHERE oa.user_id = ? AND oa.is_active = 1 AND s.is_active = 1`,
      [user.id]
    );

    if (assignment.length === 0) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: 'You are not assigned to any sector. Please contact the administrator.'
      });
    }

    if (assignment[0].slug !== sectorSlug) {
      return res.status(403).render('errors/403', {
        title: 'Access Denied',
        message: 'You are not authorized to access this sector.'
      });
    }

    req.allowedSector = { id: assignment[0].sector_id, slug: assignment[0].slug, name: assignment[0].name };
    res.locals.allowedSector = req.allowedSector;
    next();
  } catch (err) {
    console.error('requireOfficerSector error:', err.message);
    return res.status(500).render('errors/500', { title: 'Server Error' });
  }
}

function requiresSector(sectorSlug) {
  return async (req, res, next) => {
    const user = req.session.user;
    if (!user || !user.id) return res.redirect('/login');

    if (user.role === 'admin') {
      res.locals.allowedSector = { slug: sectorSlug };
      req.allowedSector = { slug: sectorSlug };
      return next();
    }

    if (user.role !== 'officer') {
      return res.status(403).render('errors/403', { title: 'Access Denied', message: 'Unauthorized.' });
    }

    try {
      const assignment = await query(
        `SELECT oa.id, oa.sector_id, s.slug, s.name, s.id AS sector_db_id
         FROM officer_assignments oa
         JOIN sectors s ON s.id = oa.sector_id
         WHERE oa.user_id = ? AND oa.is_active = 1`,
        [user.id]
      );
      if (assignment.length === 0) {
        return res.status(403).render('errors/403', {
          title: 'Access Denied',
          message: 'You are not assigned to any sector.'
        });
      }
      if (assignment[0].slug !== sectorSlug) {
        return res.status(403).render('errors/403', {
          title: 'Access Denied',
          message: 'You are not authorized to access this sector.'
        });
      }
      req.allowedSector = { id: assignment[0].sector_id, slug: assignment[0].slug, name: assignment[0].name };
      res.locals.allowedSector = req.allowedSector;
      next();
    } catch (err) {
      console.error('requiresSector error:', err.message);
      return res.status(500).render('errors/500', { title: 'Server Error' });
    }
  };
}

async function loadNotifications(req, res, next) {
  try {
    let unreadCount = 0;
    let latestNotifs = [];
    if (req.session.user && req.session.user.id) {
      latestNotifs = await query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [req.session.user.id]
      );
      const cnt = await query(
        'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
        [req.session.user.id]
      );
      unreadCount = cnt[0].c;
    }
    res.locals.unreadCount = unreadCount;
    res.locals.latestNotifs = latestNotifs;
    next();
  } catch (err) {
    res.locals.unreadCount = 0;
    res.locals.latestNotifs = [];
    next();
  }
}

module.exports = {
  requireAuth,
  requireGuest,
  requireAdmin,
  requiresSector,
  requireOfficerSector,
  loadSectorContext,
  loadNotifications
};