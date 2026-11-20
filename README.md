# VIT SCOPE Research Portal

An integrated portal for managing research scholar meetings, slots, and document repositories for the SCOPE School at VIT.

**Live site:** https://vit-scope-portal.azurewebsites.net/

## Features

### For Faculty (Dashboard)
- **Slot Booking**: Browse and book available time slots for DC Meetings, Comprehensive Viva, Colloquium, Synopsis Meetings, and Oral Exams.
- **Scheduling rules**: Each meeting type has its own allowed times and a visibility gap once a slot is booked (e.g. booking a 10:00 DC Meeting hides 10:30/11:00 but frees up 11:30/12:00). No meetings are ever scheduled on Sundays.
- **Own-schedule conflict checks**: a faculty member is never shown (or allowed to book) a slot that overlaps a meeting they already have, even across different meeting types.
- **My Schedule**: View upcoming, confirmed, cancelled, and completed bookings as a list or a calendar.
- **Documents**: Access and download research circulars and templates.
- **AI assistant**: Ask the chat widget to recommend an open slot for a given meeting type, grounded in the real, currently-available schedule.

### For Admins
- **Dashboard**: Overview of total/active/cancelled bookings and faculty count, plus the full booking records table (confirm, cancel, delete, export to CSV).
- **Calendar**: A dedicated weekly calendar view of confirmed meetings.
- **Slot Management**: Add new time slots via a date picker and quick-select time buttons.
- **Oral Exam toggle**: Oral Exam bookings are disabled portal-wide by default; the admin can enable/disable them from the Add Slots page. Enforced server-side, not just hidden in the UI.
- **Faculty allowlist**: manage which Google accounts may sign in, directly from the dashboard — no code change or redeploy required.
- **Document Management**: Upload and manage circulars/templates for faculty access.
- **AI assistant**: the same chat widget supports one-line commands to create slots, e.g. `add slot 2026-10-20 10:00-11:00`.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules (no Tailwind/Bootstrap) — custom design system
- **Database**: Azure Database for PostgreSQL
- **Storage**: Azure Blob Storage (private container; files are served via short-lived signed URLs, never public links)
- **Auth**: NextAuth v5 — Google OAuth for faculty, credentials-based login for admin
- **AI**: Azure OpenAI (chat completions) for slot recommendations and the portal chat assistant
- **Email**: Nodemailer over Gmail SMTP for booking notification emails

> This project previously ran on Supabase. It has been fully migrated to Azure — there is no
> Supabase dependency anywhere in the current codebase or runtime configuration.

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vidhijain0606/vit-scope-portal.git
   cd vit-scope-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   Copy `.env.local.example` to `.env.local` and fill in every value — none of these are
   committed to the repo and none have working defaults:
   ```bash
   cp .env.local.example .env.local
   ```
   You will need:
   - An Azure Database for PostgreSQL connection string (`DATABASE_URL`)
   - An Azure Storage account connection string + container name
   - A Google OAuth client ID/secret (for faculty sign-in)
   - A `NEXTAUTH_SECRET` (generate one, e.g. `openssl rand -base64 32`) and `NEXTAUTH_URL`
   - An Azure OpenAI endpoint, API key, and deployment name (for AI features)
   - A Gmail address + **App Password** (not your normal password) for outgoing email, plus the
     address that should receive admin booking notifications

4. **Database setup**
   Run the schema against your Postgres instance:
   ```bash
   psql "$DATABASE_URL" -f database/azure_postgres_setup.sql
   ```
   This creates the `slots`, `bookings`, `documents`, `admins`, `allowed_emails`, and
   `app_settings` tables. Then seed an admin account:
   ```bash
   SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD=<choose-a-password> node scripts/init-db.mjs
   ```

5. **Run locally**
   ```bash
   npm run dev
   ```
   Access at `http://localhost:3000`.

## Admin access

There is no default/shared admin password. The admin account is created by running
`scripts/init-db.mjs` (see step 4 above) with a password you choose — it is bcrypt-hashed in
the `admins` table, not stored anywhere in source control.

## Faculty access

Faculty sign in via Google OAuth at `/`. Only Google accounts present in the `allowed_emails`
database table may sign in; an admin manages this list from the admin dashboard.

## Documentation

- `docs/deployment_guide.md` — deploying this project to Azure App Service.
- `docs/solutions_vapt.md` — security review findings and the remediations applied to this
  codebase.
