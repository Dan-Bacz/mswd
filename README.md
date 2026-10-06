# MSWD Management Information System

A production-ready Municipal Social Welfare and Development management platform built with Next.js, Prisma, PostgreSQL, and secure role-based authorization.

## Project overview

This project includes the foundation for:

- Admin dashboards and configuration
- Officer permission boundaries by category
- Beneficiary and household management
- Case tracking and history
- Service and intervention records
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

## Prisma setup

The Prisma schema includes the main models required for the MSWD system, including User, Role, Category, UserCategory, Household, Beneficiary, Case, CaseHistory, ServiceType, Intervention, Document, Notification, AuditLog, and SystemSetting.

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

The seed routine creates the required roles and the core categories for the MSWD administration model. It does not generate fake beneficiary or case records for production use.

## Vercel deployment

1. Push code to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from .env.example.
4. Deploy the app.

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
- Configure AUTH_SECRET, MSWD_SETUP_KEY, and APP_URL
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
