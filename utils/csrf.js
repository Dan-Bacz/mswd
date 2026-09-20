const crypto = require('crypto');

function generateCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function csrfProtection(req, res, next) {
  if (req.session.csrfToken && typeof req.session.csrfToken === 'string') {
    return next();
  }
  req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  next();
}

function csrfVerify(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (req.is('multipart/form-data')) return next(); // verified again after multer parses the body
    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).redirect('/login?error=csrf');
    }
  }
  next();
}

module.exports = { generateCsrfToken, csrfProtection, csrfVerify };