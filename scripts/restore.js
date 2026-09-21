const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: npm run db:restore -- <backup-file.sql>');
  console.error('Example: npm run db:restore -- backups/mswd-20260921-1234567890.sql');
  process.exit(1);
}

const file = path.resolve(fileArg);
if (!fs.existsSync(file)) {
  console.error('File not found: ' + file);
  process.exit(1);
}

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '3306';
const USER = process.env.DB_USER || 'rmublcnhw_mswd';
const PASS = process.env.DB_PASSWORD || '';
const DB = process.env.DB_NAME || 'mublcnhw_mswd';

const args = ['--host=' + HOST, '--port=' + PORT, '--user=' + USER];
if (PASS) args.push('--password=' + PASS);
args.push(DB);

console.log('Restoring ' + file + ' into database "' + DB + '"...');
const child = spawn('mysql', args, { stdio: ['pipe', 'inherit', 'inherit'] });
fs.createReadStream(file).pipe(child.stdin);

child.on('close', code => {
  if (code === 0) {
    console.log('Restore completed.');
  } else {
    console.error('Restore FAILED (exit code ' + code + ').');
    process.exit(code || 1);
  }
});