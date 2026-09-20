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
- **Notifications** & **audit log** for important actions.
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