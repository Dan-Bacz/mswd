const { query } = require('../config/database');
const { getUnreadCount } = require('../utils/notify');
const notificationModel = require('../models/notificationModel');

exports.notificationUnread = async (req, res) => {
  try {
    const count = await getUnreadCount(req.session.user.id);
    res.json({ ok: true, unread: count });
  } catch (err) {
    res.json({ ok: false, unread: 0 });
  }
};

exports.notificationMarkRead = async (req, res) => {
  try {
    await notificationModel.markRead(req.session.user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false });
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const [users, sectors, cases] = await Promise.all([
      query('SELECT COUNT(*) AS c FROM users WHERE is_active = 1'),
      query('SELECT COUNT(*) AS c FROM sectors WHERE is_active = 1'),
      query('SELECT COUNT(*) AS c FROM case_notes')
    ]);
    res.json({ ok: true, users: users[0].c, sectors: sectors[0].c, caseNotes: cases[0].c });
  } catch (err) {
    res.json({ ok: false });
  }
};

exports.sectorStats = async (req, res) => {
  const slug = req.params.slug;
  try {
    const rows = await query(
      `SELECT s.name, s.slug,
        (SELECT COUNT(*) FROM beneficiaries b WHERE b.sector_id = s.id AND b.status = 'Active') AS beneficiaries
       FROM sectors s WHERE s.slug = ? LIMIT 1`,
      [slug]
    );
    res.json({ ok: rows.length > 0, data: rows[0] || null });
  } catch (err) {
    res.json({ ok: false });
  }
};