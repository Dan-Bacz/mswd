function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
}

module.exports = { getClientIp };