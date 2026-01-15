# Project Transfer Documentation

## Overview
This document guides the transfer of the VIT SCOPE Research Portal code to a new server (VIT Intra Server).

## 1. Prerequisites
-   **Node.js**: Version 18.x or higher.
-   **Database**: PostgreSQL (Supabase or self-hosted).
-   **Package Manager**: npm or yarn.

## 2. Installation
1.  **Clone/Copy the Codebase**: Move the verified code to the specific folder on the server.
2.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

## 3. Environment Configuration
Create a `.env.local` file in the root directory. You must update these values with the *Company's* specific credentials.

```env
# Database / Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_OR_API_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_KEY"
# SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" # Optional: Only if used for backend admin tasks
```

> **IMPORTANT**: 
> - **Change Passwords**: Ensure any database passwords in connection strings are updated immediately.
> - **Database URL**: If connecting directly to Postgres, ensure the connection string is correct.

## 4. Database Setup (SQL Schema)
**Do not manually create tables.** We have provided a master setup script.

1.  Locate the file **`supabase_setup.sql`** in the root directory of this project.
2.  Copy its entire content.
3.  Run the SQL in your database (via Supabase SQL Editor or pgAdmin).

**This script will automatically:**
-   Create required tables: `users`, `slots` (30-min intervals supported), `bookings`, `documents`.
-   Enable Row Level Security (RLS).
-   Create necessary User Policies (allowing "Public" uploads for simulated Admins).
-   Create and configure the `documents` Storage Bucket.

## 5. Deployment
To run the application in production mode:

```bash
npm run build
npm start
```

The application will typically start on port 3000 (e.g., `http://localhost:3000`).

## 6. Key Features Included in this Build
-   **30-Minute Slots**: The system now supports half-hour booking slots (e.g., 10:00, 10:30).
-   **Documents Module**: Full upload/download capability for research circulars.
-   **Validation**: Restricted meeting types (Synopsis/Oral Exam) blocked at unauthorized times.
-   **Simulated Admin**: Login system specifically configured for internal use without external auth dependencies.

## 7. Changing Credentials
-   **Database Access**: Update `NEXT_PUBLIC_SUPABASE_URL` and keys in `.env.local`.
-   **Admin Access**:
    -   The current Admin Login is simulated in `src/app/admin-login/page.tsx` (Default: `admin` / `admin123`).
    -   To change this, edit the `handleLogin` function in that file directly.

## 8. Access Control & Security
The portal now enforces strict domain access (`@vit.ac.in`) for Google Logins.

### Enabling Restricted Allowlist
To restrict access to a specific list of Faculty emails (as per the "CSV feature" request):
1.  Open `src/utils/accessControl.ts`.
2.  Populate `ALLOWED_EMAILS` with the list of authorized emails (e.g., from the CSV).
3.  Uncomment the code block under `// 2. Check Allowlist`.

```typescript
// src/utils/accessControl.ts
export const ALLOWED_EMAILS = ['faculty1@vit.ac.in', 'faculty2@vit.ac.in'];
```
