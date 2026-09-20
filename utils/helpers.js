function paginate(page, perPage, total) {
  page = Math.max(1, parseInt(page, 10) || 1);
  perPage = Math.max(1, parseInt(perPage, 10) || 15);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (page > totalPages) page = totalPages;
  return {
    page,
    perPage,
    total,
    totalPages,
    offset: (page - 1) * perPage,
    hasPrev: page > 1,
    hasNext: page < totalPages
  };
}

function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
}

function formatDate(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(v) {
  if (!v) return '—';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[d.getUTCMonth()] + ' ' + String(d.getUTCDate()).padStart(2, '0') + ', ' + d.getUTCFullYear();
}

function formatDateTime(v) {
  if (!v) return '—';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return months[d.getUTCMonth()] + ' ' + String(d.getUTCDate()).padStart(2, '0') + ', ' + d.getUTCFullYear() + ' ' + hh + ':' + mm;
}

function calculateAge(dob) {
  if (!dob) return '—';
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age >= 0 ? age : '—';
}

function fullName(row) {
  if (!row) return '';
  const parts = [];
  if (row.first_name) parts.push(row.first_name);
  if (row.middle_name) parts.push(row.middle_name);
  if (row.last_name) parts.push(row.last_name);
  let name = parts.join(' ');
  if (row.suffix) name += ', ' + row.suffix;
  return name || '';
}

const STATUS_BADGE = {
  active: 'badge-green',
  inactive: 'badge-gray',
  archived: 'badge-gray',
  new: 'badge-blue',
  'under assessment': 'badge-cyan',
  'under intervention': 'badge-blue',
  'for follow-up': 'badge-amber',
  closed: 'badge-gray',
  referred: 'badge-purple',
  scheduled: 'badge-blue',
  completed: 'badge-green',
  missed: 'badge-red',
  cancelled: 'badge-gray',
  pending: 'badge-amber',
  missing: 'badge-red',
  'not received': 'badge-amber',
  received: 'badge-green',
  suspended: 'badge-red',
  deceased: 'badge-gray',
  resolved: 'badge-green',
  expired: 'badge-red',
  approved: 'badge-green',
  rejected: 'badge-red'
};

function badgeClass(status) {
  if (!status) return 'badge-gray';
  const key = String(status).toLowerCase();
  return STATUS_BADGE[key] || 'badge-blue';
}

function money(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

module.exports = {
  paginate,
  toInt,
  formatDate,
  formatDisplayDate,
  formatDateTime,
  calculateAge,
  fullName,
  badgeClass,
  money
};