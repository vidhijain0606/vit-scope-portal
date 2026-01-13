# VIT SCOPE Research Portal

An integrated portal for managing research scholar meetings, slots, and document repositories for the SCOPE School at VIT.

## Features

### For Faculties (Dashboard)
- **Slot Booking**: View available time slots for research meetings.
- **Filtering**: Filter available slots by Date, Room, or Status.
- **Validation**: Strict checks for meetings like `SYNOPSIS` or `ORAL EXAM` (Allowed only at 11:30, 14:30, 16:00).
- **Documents**: Access and download important research circulars and templates.
- **My Schedule**: View upcoming and past bookings.

### For Admins
- **Dashboard**: Overview of total slots, pending requests, and approved bookings.
- **Slot Management**: Add new slots (Manual or Bulk Seeding).
- **Document Management**: Upload new documents/circulars for faculty access.
- **Requests**: Approve or Reject booking requests (Simulated workflow).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: RAW CSS Modules (No Tailwind/Bootstrap) - Custom Design System.
- **Backend/DB**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (Google OAuth) + Custom Admin Guard.

## Installation and Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/vidhijain0606/vit-scope-portal.git
    cd vit-scope-portal
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
    ```

4.  **Database Setup (CRITICAL)**
    To set up the database (Tables, Policies, Storage) on a fresh Supabase instance:
    1.  Copy the contents of `supabase_setup.sql` (found in the root folder).
    2.  Go to your [Supabase Dashboard](https://supabase.com/dashboard) -> **SQL Editor**.
    3.  Paste and Run the script.
    
    *This creates the `slots`, `bookings`, `documents` tables and configures the necessary Security Policies.*

5.  **Run Locally**
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`.

## Default Credentials

### Admin Login
- **URL**: `/admin-login`
- **ID**: `admin`
- **Password**: `admin123`
*Note: This is a simulated admin login for internal use.*

### Faculty Login
- **URL**: `/`
- Login via **Google Auth** (Recommended: VIT Email).

## Documentation
See `deployment_guide.md` for specific instructions on moving this project to the VIT Intra Server.
