const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Uploaded documents live outside the repository. Directory is created on demand.
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const now = new Date();
    const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const target = path.join(uploadsDir, ym);
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.mkdirSync(target, { recursive: true });
    cb(null, target);
  },
  filename(req, file, cb) {
    const safeBase = (file.originalname || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + '-' + safeBase);
  }
});
const upload = multer({ storage });

module.exports = { router, upload };