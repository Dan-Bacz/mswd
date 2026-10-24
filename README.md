# MSWD Management Information System

A production-ready Municipal Social Welfare and Development management platform built with Next.js, Prisma, PostgreSQL, and secure role-based authorization.

## Project overview

This project includes the foundation for:

- Admin dashboards and configuration
- Officer permission boundaries by category
- Beneficiary and household management
- Assistance records for beneficiaries
- Notification, audit, and reporting modules
- Deployment for Vercel and Neon PostgreSQL

## Technology stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Neon-ready)
- Secure cookie session authentication
- Zod validation
- Recharts-ready dashboard structure

## Local development setup

1. Install dependencies:
   npm install
2. Create a local environment file based on .env.example.
3. Set DATABASE_URL and AUTH_SECRET.
4. Run Prisma generate:
   npx prisma generate
5. Start the app:
   npm run dev

## Neon setup

1. Create a PostgreSQL database in Neon.
2. Copy the connection string into DATABASE_URL.
3. If necessary, add DIRECT_URL in environments that require a direct connection for Prisma migrations.
4. Configure production variables separately in Vercel.

## Environment variables

Use .env.example as the template. Required values include:

- DATABASE_URL
- DIRECT_URL
- AUTH_SECRET
- MSWD_SETUP_KEY
- APP_URL
- SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD (required for officer approval emails)
- EMAIL_FROM (the sender address authorized by your SMTP provider)

## Prisma setup

The Prisma schema includes the main models required for the MSWD system, including User, Role, Category, UserCategory, Household, Beneficiary, BeneficiaryAssistance, Document, Assignment, Notification, AuditLog, and SystemSetting.

Run:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

## Database migration

For local development:

```bash
npx prisma migrate dev --name init
```

For deployment:

```bash
npx prisma migrate deploy
```

## Seed process

The seed routine creates the required roles and the core categories for the MSWD administration model. It does not generate fake beneficiary or assistance records for production use.

## Officer registration and approval

Officers can register from the login page. New registrations remain pending and cannot sign in until an administrator approves them from Officer management. Approval sends an email through the configured SMTP server and activates the account; administrators can then assign the officer's categories.

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` with the SMTP details from your email provider. Use an `EMAIL_FROM` sender address authorized by that provider. Set `APP_URL` to the deployed application's absolute URL so the approval message contains the correct login link. Apply the pending-approval migration with `npx prisma migrate deploy` in deployed environments.

## Vercel deployment

1. Push code to GitHub.
2. Import the repository into Vercel.
3. Open the Vercel project and go to **Settings → Environment Variables**.
4. Add the following variables for **Production** (and Preview/Development too, if those deployments need them):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection string from your database provider |
   | `AUTH_SECRET` | A securely generated random secret; keep it private |
   | `MSWD_SETUP_KEY` | A separate private key used for initial administrator setup |
   | `APP_URL` | The deployed app's full base URL, e.g. `https://your-app.vercel.app` (no `/login`) |
   | `SMTP_HOST` | SMTP hostname from your email provider |
   | `SMTP_PORT` | Usually `587` for STARTTLS or `465` for SSL |
   | `SMTP_USER` | SMTP username from your email provider |
   | `SMTP_PASSWORD` | SMTP password or provider-issued app password |
   | `EMAIL_FROM` | Sender address authorized by your SMTP provider |

   Add `DIRECT_URL` only if your database provider supplies a separate direct connection string for migrations. SMTP credentials and database URLs must be entered as Vercel environment-variable values—do not commit them to `.env.example` or source control.

5. Click **Save**, then redeploy so the deployment receives the new variables. If you change a variable later, redeploy again.
6. Apply all pending database migrations with `npx prisma migrate deploy` using the production database before using newly deployed features such as officer registration and assistance tracking.

Vercel does not provide an SMTP mailbox. Get the SMTP host, port, username, and password from an email provider that permits SMTP connections from Vercel, and ensure `EMAIL_FROM` is an approved sender address with that provider.

## Initial administrator setup

Set a strong MSWD_SETUP_KEY in the environment, then visit /setup and create the first administrator account.

## Security notes

- Secrets remain server-only.
- Session cookies are secure and HTTP-only in production.
- Access checks are enforced server-side.
- Officer access is restricted by authorized category assignment.
- Upload and document access must be validated against the user's permissions.

## Production deployment checklist

- Configure DATABASE_URL in Vercel
- Configure AUTH_SECRET, MSWD_SETUP_KEY, APP_URL, and the SMTP variables in Vercel
- Run Prisma migration on production
- Validate admin and officer routes
- Confirm category restrictions are enforced on protected resources
- Test login, logout, and unauthorized access scenarios

## Commands to run locally

```bash
npm install
npx prisma generate
npm run dev
```

## Commands to deploy

```bash
npx prisma migrate deploy
npm run build
npm run start
```
