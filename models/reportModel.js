const { query } = require('../config/database');

const SECTOR_CONFIG = require('./recordModel').SECTOR_CONFIG;

function parseMonth(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) {
    month = new Date().toISOString().slice(0, 7);
  }
  return month;
}

function monthBounds(month) {
  const [y, m] = month.split('-').map(Number);
  const start = month + '-01';
  const next = new Date(Date.UTC(y, m - 1, 1));
  next.setUTCMonth(next.getUTCMonth() + 1);
  const end = next.toISOString().slice(0, 10);
  return { start, end };
}

function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[m - 1] + ' ' + y;
}

function lastMonths(count) {
  const now = new Date();
  const list = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    list.push({ value: ym, label: monthLabel(ym) });
  }
  return list;
}

const CLOSING = {
  'juvenile': { statuses: ["'Closed'"], open: `case_status NOT IN ('Closed')`, dateCol: 'date_closed' },
  'solo-parent': { statuses: ["'Inactive'", "'Expired'"], open: `status = 'Active'`, dateCol: 'updated_at' },
  'senior-citizens': { statuses: ["'Inactive'", "'Deceased'"], open: `status = 'Active'`, dateCol: 'updated_at' },
  'pwd': { statuses: ["'Inactive'"], open: `status = 'Active'`, dateCol: 'updated_at' }
};

async function monthly(month, options = {}) {
  const { sectorId = null } = options;
  month = parseMonth(month);
  const { start, end } = monthBounds(month);

  const sectorWhere = sectorId ? ' AND b.sector_id = ?' : '';
  const sectorParams = sectorId ? [sectorId] : [];

  const [activeBeneficiaries, totalBeneficiaries, newRegistrations] = await Promise.all([
    query(`SELECT COUNT(*) AS c FROM beneficiaries b WHERE b.status = 'Active'${sectorWhere}`, sectorParams),
    query(`SELECT COUNT(*) AS c FROM beneficiaries b WHERE 1=1${sectorWhere}`, sectorParams),
    query(`SELECT COUNT(*) AS c FROM beneficiaries b WHERE b.registration_date >= ? AND b.registration_date < ?${sectorWhere}`, [start, end].concat(sectorParams))
  ]);

  const sectors = await query(
    `SELECT s.id, s.name, s.slug FROM sectors s WHERE s.is_active = 1 ORDER BY s.name`
  );
  const scopedSectors = sectorId ? sectors.filter(s => String(s.id) === String(sectorId)) : sectors;

  const perSector = [];
  for (const sec of scopedSectors) {
    const cfg = SECTOR_CONFIG[sec.slug];
    if (!cfg) continue;
    const closing = CLOSING[sec.slug] || CLOSING['pwd'];
    const c1 = await query(
      `SELECT COUNT(*) AS c FROM beneficiaries b WHERE b.sector_id = ? AND b.status = 'Active'`,
      [sec.id]
    );
    const c2 = await query(`SELECT COUNT(*) AS c FROM ${cfg.table}`);
    const c3 = await query(`SELECT COUNT(*) AS c FROM ${cfg.table} WHERE ${closing.open}`);
    const c4 = await query(
      `SELECT COUNT(*) AS c FROM ${cfg.table} WHERE DATE(created_at) >= ? AND DATE(created_at) < ?`,
      [start, end]
    );
    const c5 = await query(
      `SELECT COUNT(*) AS c FROM ${cfg.table} WHERE ${cfg.statusColumn} IN (${closing.statuses.join(', ')})
         AND DATE(${closing.dateCol}) >= ? AND DATE(${closing.dateCol}) < ?`,
      [start, end]
    );
    perSector.push({
      id: sec.id,
      slug: sec.slug,
      name: sec.name,
      beneficiaries: c1[0].c,
      cases: c2[0].c,
      openCases: c3[0].c,
      openedInMonth: c4[0].c,
      closedInMonth: c5[0].c
    });
  }

  const officers = await query(
    `SELECT u.id, u.first_name, u.last_name,
            (SELECT s.id FROM officer_assignments oa JOIN sectors s ON s.id = oa.sector_id
              WHERE oa.user_id = u.id AND oa.is_active = 1 ORDER BY oa.assigned_at DESC LIMIT 1) AS sector_id,
            (SELECT s.name FROM officer_assignments oa JOIN sectors s ON s.id = oa.sector_id
              WHERE oa.user_id = u.id AND oa.is_active = 1 ORDER BY oa.assigned_at DESC LIMIT 1) AS sector_name
     FROM users u
     WHERE u.role_id = (SELECT id FROM roles WHERE name = 'officer') AND u.is_active = 1 AND u.is_approved = 1
     ORDER BY u.last_name, u.first_name`
  );
  const scopedOfficers = (sectorId ? officers.filter(o => String(o.sector_id) === String(sectorId)) : officers).slice(0, 12);

  const officerCaseload = [];
  for (const off of scopedOfficers) {
    const total = await query(
      `SELECT COUNT(*) AS c FROM (
         SELECT id FROM juvenile_records WHERE assigned_officer_id = ?
         UNION ALL SELECT id FROM solo_parent_records WHERE assigned_officer_id = ?
         UNION ALL SELECT id FROM senior_citizen_records WHERE assigned_officer_id = ?
         UNION ALL SELECT id FROM pwd_records WHERE assigned_officer_id = ?
       ) t`,
      [off.id, off.id, off.id, off.id]
    );
    const open = await query(
      `SELECT COUNT(*) AS c FROM (
         SELECT id FROM juvenile_records WHERE assigned_officer_id = ? AND case_status NOT IN ('Closed')
         UNION ALL SELECT id FROM solo_parent_records WHERE assigned_officer_id = ? AND status = 'Active'
         UNION ALL SELECT id FROM senior_citizen_records WHERE assigned_officer_id = ? AND status = 'Active'
         UNION ALL SELECT id FROM pwd_records WHERE assigned_officer_id = ? AND status = 'Active'
       ) t`,
      [off.id, off.id, off.id, off.id]
    );
    const closed = await query(
      `SELECT COUNT(*) AS c FROM (
         SELECT id FROM juvenile_records WHERE assigned_officer_id = ? AND case_status = 'Closed' AND DATE(date_closed) >= ? AND DATE(date_closed) < ?
         UNION ALL SELECT id FROM solo_parent_records WHERE assigned_officer_id = ? AND status IN ('Inactive','Expired') AND DATE(updated_at) >= ? AND DATE(updated_at) < ?
         UNION ALL SELECT id FROM senior_citizen_records WHERE assigned_officer_id = ? AND status IN ('Inactive','Deceased') AND DATE(updated_at) >= ? AND DATE(updated_at) < ?
         UNION ALL SELECT id FROM pwd_records WHERE assigned_officer_id = ? AND status = 'Inactive' AND DATE(updated_at) >= ? AND DATE(updated_at) < ?
       ) t`,
      [off.id, start, end, off.id, start, end, off.id, start, end, off.id, start, end]
    );
    officerCaseload.push({
      id: off.id,
      name: [off.first_name, off.last_name].filter(Boolean).join(' '),
      sector: off.sector_name,
      totalAssigned: total[0].c,
      openCases: open[0].c,
      closedInMonth: closed[0].c
    });
  }

  const servicesBySector = await query(
    `SELECT sec.name AS sector_name, sec.slug AS sector_slug, COUNT(*) AS total
     FROM case_services cs
     JOIN beneficiaries b ON b.id = cs.beneficiary_id
     JOIN sectors sec ON sec.id = b.sector_id
     WHERE cs.date_provided >= ? AND cs.date_provided < ?
     GROUP BY sec.id, sec.name, sec.slug
     ORDER BY sec.name`,
    [start, end]
  );
  const servicesTotal = servicesBySector.reduce((s, r) => s + r.total, 0);

  const scopedNotes = sectorId
    ? ` AND (
        EXISTS (SELECT 1 FROM juvenile_records r1 WHERE r1.id = n.sector_record_id AND r1.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
        OR EXISTS (SELECT 1 FROM solo_parent_records r2 WHERE r2.id = n.sector_record_id AND r2.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
        OR EXISTS (SELECT 1 FROM senior_citizen_records r3 WHERE r3.id = n.sector_record_id AND r3.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
        OR EXISTS (SELECT 1 FROM pwd_records r4 WHERE r4.id = n.sector_record_id AND r4.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
      )`
    : '';

  const scopedFollowups = sectorId
    ? ` AND (
        EXISTS (SELECT 1 FROM juvenile_records r1 WHERE r1.id = f.sector_record_id AND r1.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
        OR EXISTS (SELECT 1 FROM solo_parent_records r2 WHERE r2.id = f.sector_record_id AND r2.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
        OR EXISTS (SELECT 1 FROM senior_citizen_records r3 WHERE r3.id = f.sector_record_id AND r3.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
        OR EXISTS (SELECT 1 FROM pwd_records r4 WHERE r4.id = f.sector_record_id AND r4.beneficiary_id IN (SELECT id FROM beneficiaries WHERE sector_id = ${Number(sectorId)}))
      )`
    : '';

  const notesAdded = await query(
    `SELECT COUNT(*) AS c FROM case_notes n WHERE n.created_at >= ? AND n.created_at < ?${scopedNotes}`,
    [start, end]
  );
  const followupsScheduled = await query(
    `SELECT COUNT(*) AS c FROM case_followups f WHERE f.created_at >= ? AND f.created_at < ?${scopedFollowups}`,
    [start, end]
  );
  const followupsCompleted = await query(
    `SELECT COUNT(*) AS c FROM case_followups f WHERE f.completed_date >= ? AND f.completed_date < ?${scopedFollowups}`,
    [start, end]
  );

  const recentRegistrations = await query(
    `SELECT b.beneficiary_number, CONCAT_WS(' ', b.first_name, b.middle_name, b.last_name) AS name,
            b.barangay, b.registration_date
     FROM beneficiaries b
     WHERE b.registration_date >= ? AND b.registration_date < ?${sectorWhere}
     ORDER BY b.registration_date DESC LIMIT 10`,
    [start, end].concat(sectorParams)
  );

  const recentCases = await query(
    `SELECT 'juvenile' AS sector, 'opened' AS action, r.case_number AS number, r.case_status AS status, DATE(r.created_at) AS on_date
       FROM juvenile_records r JOIN beneficiaries b ON b.id = r.beneficiary_id
       WHERE DATE(r.created_at) >= ? AND DATE(r.created_at) < ?${sectorWhere}
     UNION ALL
     SELECT 'solo-parent', 'opened', r1.record_number, r1.status, DATE(r1.created_at)
       FROM solo_parent_records r1 JOIN beneficiaries b ON b.id = r1.beneficiary_id
       WHERE DATE(r1.created_at) >= ? AND DATE(r1.created_at) < ?${sectorWhere}
     UNION ALL
     SELECT 'senior-citizens', 'opened', r2.record_number, r2.status, DATE(r2.created_at)
       FROM senior_citizen_records r2 JOIN beneficiaries b ON b.id = r2.beneficiary_id
       WHERE DATE(r2.created_at) >= ? AND DATE(r2.created_at) < ?${sectorWhere}
     UNION ALL
     SELECT 'pwd', 'opened', r3.record_number, r3.status, DATE(r3.created_at)
       FROM pwd_records r3 JOIN beneficiaries b ON b.id = r3.beneficiary_id
       WHERE DATE(r3.created_at) >= ? AND DATE(r3.created_at) < ?${sectorWhere}
     ORDER BY on_date DESC LIMIT 10`,
    [start, end, start, end, start, end, start, end].concat(sectorParams)
  );

  const casesAllTime = perSector.reduce((s, r) => s + r.cases, 0);
  const openAllTime = perSector.reduce((s, r) => s + r.openCases, 0);
  const openedAllTime = perSector.reduce((s, r) => s + r.openedInMonth, 0);
  const closedAllTime = perSector.reduce((s, r) => s + r.closedInMonth, 0);

  return {
    month,
    monthLabel: monthLabel(month),
    start,
    end,
    months: lastMonths(13),
    totals: {
      totalBeneficiaries: totalBeneficiaries[0].c,
      activeBeneficiaries: activeBeneficiaries[0].c,
      newRegistrations: newRegistrations[0].c,
      casesAllTime,
      openAllTime,
      openedAllTime,
      closedAllTime,
      servicesTotal,
      servicesSectorCount: servicesBySector.length,
      notesAdded: notesAdded[0].c,
      followupsScheduled: followupsScheduled[0].c,
      followupsCompleted: followupsCompleted[0].c
    },
    perSector,
    officerCaseload,
    servicesBySector,
    recentRegistrations,
    recentCases,
    isScoped: !!sectorId
  };
}

function csvEscape(value) {
  const s = String(value === null || value === undefined ? '' : value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function buildCsv(data) {
  const lines = [];
  const total = data.totals;
  lines.push('MAHAYAG MSWD - MONTHLY ACCOMPLISHMENT REPORT (' + data.monthLabel + ')');
  lines.push(['Generated', new Date().toLocaleString()].map(csvEscape).join(','));
  lines.push('');
  lines.push(['SUMMARY', ''].map(csvEscape).join(','));
  lines.push(['Total Beneficiaries', total.totalBeneficiaries].map(csvEscape).join(','));
  lines.push(['Active Beneficiaries', total.activeBeneficiaries].map(csvEscape).join(','));
  lines.push(['New Registrations', total.newRegistrations].map(csvEscape).join(','));
  lines.push(['Total Cases on File', total.casesAllTime].map(csvEscape).join(','));
  lines.push(['Active / Open Cases', total.openAllTime].map(csvEscape).join(','));
  lines.push(['Cases Opened This Month', total.openedAllTime].map(csvEscape).join(','));
  lines.push(['Cases Closed This Month', total.closedAllTime].map(csvEscape).join(','));
  lines.push(['Services Provided', total.servicesTotal].map(csvEscape).join(','));
  lines.push(['Case Notes Added', total.notesAdded].map(csvEscape).join(','));
  lines.push(['Follow-ups Scheduled', total.followupsScheduled].map(csvEscape).join(','));
  lines.push(['Follow-ups Completed', total.followupsCompleted].map(csvEscape).join(','));
  lines.push('');
  lines.push(['CASES / GROUP', '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Group', 'Cases on File', 'Open', 'Opened This Month', 'Closed This Month'].map(csvEscape).join(','));
  for (const r of data.perSector) {
    lines.push([r.name, r.cases, r.openCases, r.openedInMonth, r.closedInMonth].map(csvEscape).join(','));
  }
  lines.push('');
  lines.push(['STAFF CASELOAD (assigned cases)', '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Officer', 'Sector', 'Total Assigned', 'Open', 'Closed This Month'].map(csvEscape).join(','));
  for (const r of data.officerCaseload) {
    lines.push([r.name, r.sector, r.totalAssigned, r.openCases, r.closedInMonth].map(csvEscape).join(','));
  }
  lines.push('');
  lines.push(['SERVICES PROVIDED BY GROUP', '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Group', 'Services Provided'].map(csvEscape).join(','));
  for (const r of data.servicesBySector) {
    lines.push([r.sector_name, r.total].map(csvEscape).join(','));
  }
  if (!data.servicesBySector.length) {
    lines.push(['No services recorded this month', '0'].map(csvEscape).join(','));
  }
  lines.push('');
  lines.push(['NEW REGISTRATIONS - ' + data.monthLabel, '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Beneficiary No.', 'Name', 'Barangay', 'Date', ''].map(csvEscape).join(','));
  for (const r of data.recentRegistrations) {
    lines.push([r.beneficiary_number, r.name, r.barangay, r.registration_date, ''].map(csvEscape).join(','));
  }
  lines.push('');
  lines.push(['CASES OPENED - ' + data.monthLabel, '', '', '', ''].map(csvEscape).join(','));
  lines.push(['Group', 'Case No.', 'Status', 'Date', ''].map(csvEscape).join(','));
  for (const r of data.recentCases) {
    lines.push([r.sector, r.number, r.status, r.on_date, ''].map(csvEscape).join(','));
  }
  return lines.join('\r\n');
}

module.exports = { monthly, monthLabel, lastMonths, buildCsv };