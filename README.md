# Mahayag Social Welfare and Development — Management System

A professional municipal social-welfare management system for the MSWD Office of Mahayag, Zamboanga del Sur. Built with **Node.js 22, Express, EJS, MySQL** and vanilla JavaScript — no frontend framework.

## Features
- **Two roles** — Administrator (full access) and Sector Officer (scoped to the assigned sector).
- **Server-side authorization** enforced at every route: officers receive **403** if they try to open `/admin`, another sector, or records outside their assignment.
- **Sectors:** Juvenile, Solo Parents, Senior Citizens, PWD (extensible — add rows in `sectors`).
- **Beneficiaries** — add / edit / view / archive, search, filter, pagination.
- **Case records** per sector, with **case notes**, **follow-ups**, **status updates** and **document uploads**.
- **Officer management** — create, activate/deactivate, assign/change sector, reset password.
- **User approval queue** (officer self-registrations pending admin approval).
- **Reports** — totals, cases by sector/status, monthly registrations, officer workload (CSS charts, no external libraries).
- **Monthly Accomplishment Report** — month-picker summary of beneficiaries, registrations, cases opened/closed per group, staff caseload, services provided, and activity; export as **Excel (CSV)** or **PDF (Print)** with no extra libraries.
- **Household / family composition** per beneficiary and **duplicate-record detection** on registration.
- **Services catalog** (`/admin/services`) and recording of **services/interventions** under any beneficiary or case record.
- **Notifications** & **audit log** for important actions.
- **Automatic database backup** (`npm run db:backup`) and restore (`npm run db:restore`) — safe to run on a daily cron.
- Secure sessions, **CSRF** protection, **Helmet**, **rate-limited login**, **bcrypt** hashing, parameterized queries.

## Quick start
1. `npm install`
2. Copy `.env.example` to `.env` and fill in database credentials + a strong `SESSION_SECRET`.
3. Make sure the MySQL database exists (`database/schema.sql` creates everything idempotently):
   `mysql -u your_user -p your_db < database/schema.sql`
4. `node server.js` (listens on `process.env.PORT || 3000`, bound to `0.0.0.0`).

Default admin from the schema seed: `admin` / `admin123` — **change immediately in production**.

## Structure
```
server.js
config/database.js
middleware/auth.js            session + context helpers
middleware/authorization.js   role + sector authorization
routes/{auth,admin,officer,api}.js
controllers/{authController,adminController,officerController,apiController}.js
models/                        data access layer (parameterized queries)
utils/                         csrf, audit, notifications, formatters
views/
  layouts/app.ejs              shared app shell (sidebar + header)
  auth/  admin/  officer/  errors/
public/css/app.css, public/js/app.js
database/schema.sql
.env.example
```

## Deployment (Z.com / cPanel Node.js App)
- Startup file: `server.js`
- App listens on `process.env.PORT || 3000` and `0.0.0.0`.
- Set `NODE_ENV=production` and a strong `SESSION_SECRET` in `.env` on the server.
- Never upload `.env` to the repository.
- New tables (`services`, `case_services`, `beneficiary_household`) require a fresh schema load on first deploy:
  `mysql -u your_user -p your_db < database/schema.sql` (idempotent) or run `database/migrations/001_household.sql`.

## Backup & recovery
Configure the same values as `.env` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).

- **Backup:** `npm run db:backup`
  Writes `backups/mswd-YYYYMMDD-<timestamp>.sql` (with `--single-transaction --routines --triggers`) and automatically keeps the newest 14 backups.
- **Restore:** `npm run db:restore -- backups/<file>.sql`
  Runs that SQL dump back into the database. The app should be stopped during a restore.
- **Automate (cPanel / cron):** create a daily cron job, e.g.
  `cd /path/to/app && /usr/bin/node scripts/backup.js`
  Add a second cron entry to download a copy of the newest `backups/*.sql` off the server for off-site storage.