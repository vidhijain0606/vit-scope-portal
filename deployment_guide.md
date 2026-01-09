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
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" # If used for admin tasks

# Email Configuration (If using SMTP)
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587
SMTP_USER="your.email@vit.ac.in"
SMTP_PASS="your_password_here"
```

> **IMPORTANT**: 
> - **Change Passwords**: Ensure the `SMTP_PASS` and any database passwords in connection strings are updated immediately.
> - **Database URL**: If connecting directly to Postgres, ensure the connection string is correct.

## 4. Database Setup (SQL Schema)
Run the following SQL commands in your PostgreSQL database to set up the required tables.

```sql
-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Users Table (or link with Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique,
  full_name text,
  role text check (role in ('admin', 'faculty', 'student')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Slots Table
create table public.slots (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Create Bookings Table
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  slot_id uuid references public.slots,
  student_id uuid, -- Link to user who booked (Faculty in this context)
  student_name text,
  student_reg_no text, -- Scholar ID
  scholar_name text,
  emp_name text, -- Faculty Name
  emp_id text,
  status text default 'pending', -- pending, confirmed, cancelled
  meeting_type text, -- Research Meeting, DAC Meetings
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Create Documents Table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Important Policies (Row Level Security)
alter table public.bookings enable row level security;
alter table public.documents enable row level security;
-- Add policies as per requirement (e.g., enable read for all authenticated users)
create policy "Public read documents" on public.documents for select using (true);
```

## 5. Deployment
To run the application in production mode:

```bash
npm run build
npm start
```

The application will typically start on port 3000 (e.g., `http://localhost:3000`).

## 6. List of Changes for Transfer
Review these files to customize branding or hardcoded values:

1.  **`src/app/layout.tsx`**: Update title and metadata.
2.  **`src/components/Layout/Sidebar.tsx`**: Update logo or menu items if needed.
3.  **`src/components/UI`**: Check for any hardcoded colors in CSS modules if not using global variables.
4.  **`src/utils/supabase.ts`**: Ensure the client initialization matches your new environment.

## 7. Changing Credentials
-   **Database Access**: Update `NEXT_PUBLIC_SUPABASE_URL` and keys in `.env.local`.
-   **Admin Access**: If you have hardcoded admin emails in `src/components/Auth/AdminGuard.tsx` (e.g., `if (user.email === 'admin@vit.ac.in')`), update them to the new admin's email.

```typescript
// Example in AdminGuard.tsx
const ADMIN_EMAILS = ['new.admin@vit.ac.in', 'dean.scope@vit.ac.in'];
```

## 8. Access Control & Security
The portal now enforces strict domain access (`@vit.ac.in`).

### Enabling Restricted Allowlist
To restrict access to a specific list of Faculty emails (as per the "CSV feature" request):
1.  Open `src/utils/accessControl.ts`.
2.  Populate `ALLOWED_EMAILS` with the list of authorized emails (e.g., from the CSV).
3.  Uncomment the code block under `// 2. Check Allowlist`.

```typescript
// src/utils/accessControl.ts
export const ALLOWED_EMAILS = ['faculty1@vit.ac.in', 'faculty2@vit.ac.in'];
```
