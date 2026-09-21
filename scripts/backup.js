const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '3306';
const USER = process.env.DB_USER || 'rmublcnhw_mswd';
const PASS = process.env.DB_PASSWORD || '';
const DB = process.env.DB_NAME || 'mublcnhw_mswd';
const KEEP = 14;

const outDir = path.join(__dirname, '..', 'backups');
fs.mkdirSync(outDir, { recursive: true });

const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const file = path.join(outDir, 'mswd-' + ts + '-' + Date.now() + '.sql');

const args = [
  '--host=' + HOST,
  '--port=' + PORT,
  '--user=' + USER
];
if (PASS) args.push('--password=' + PASS);
args.push('--single-transaction', '--routines', '--triggers', '--databases', DB);

execFile('mysqldump', args, { maxBuffer: 512 * 1024 * 1024, timeout: 600000 }, (err, stdout, stderr) => {
  if (err) {
    console.error('Backup FAILED:', err.message);
    if (stderr) console.error(stderr.split('\n').slice(0, 5).join('\n'));
    process.exit(1);
  }
  fs.writeFileSync(file, stdout);
  console.log('Backup written: ' + file);

  const all = fs.readdirSync(outDir).filter(f => f.endsWith('.sql')).sort();
  const excess = all.length - KEEP;
  for (let i = 0; i < excess; i++) {
    fs.unlinkSync(path.join(outDir, all[i]));
  }
  console.log('Backups retained: ' + Math.min(all.length, KEEP));
});