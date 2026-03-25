# Supabase to Intranet Migration Guide

This document lists all **Supabase** dependencies and integration points. To migrate this application to the VIT Intranet Server (where Supabase is unavailable), you must replace the following modules with your internal API logic.

## 1. Authentication (`supabase.auth`)
The application uses Supabase Auth for Google Login and Session Management.

**Files to Modify:**
- `src/utils/supabase.ts`: (Client Initialization) - **Replace this entire file** with your Intranet Auth Client.
- `src/app/auth/callback/page.tsx`: Handles OAuth callback. **Rewrite** to handle your Intranet SSO callback.
- `src/components/Auth/AdminGuard.tsx`: Checks `supabase.auth.getUser()`. **Replace** with your internal session check.
- `src/components/Layout/Navbar.tsx`: Uses `getUser()` for profile and `signOut()`.
- `src/components/Dashboard/DashboardView.tsx`: Fetches user session.
- `src/components/Booking/BookingView.tsx`: Fetches user session.
- `src/components/Booking/BookingSidebar.tsx`: Dynamic import of Supabase auth.

**Intranet Replacement Strategy:**
- Implement a `useAuth()` hook that calls your Intranet Identity Provider.
- Replace `supabase.auth.getUser()` with `fetch('/api/user/me')`.

---

## 2. Database Tables (`supabase.from(table)`)
The app communicates with a Postgres database via Supabase Client. You need to replace these calls with standard `fetch()` calls to your Intranet Backend API.

### Table: `bookings`
Used for storing appointment details.
- **Fetch (Select):**
    - `src/components/Dashboard/DashboardView.tsx`: Fetches user's bookings.
    - `src/components/Admin/AdminTable.tsx`: Fetches ALL bookings for Admin.
    - `src/components/Admin/AdminView.tsx`: Counts bookings.
- **Insert (Create):**
    - `src/components/Booking/BookingView.tsx`: Creates a new booking.
- **Update (Cancel/Status):**
    - `src/components/Dashboard/DashboardView.tsx`: Cancels booking (`status: 'cancelled'`).

### Table: `slots`
Used for available time slots.
- **Fetch (Select):**
    - `src/components/Booking/SlotGrid.tsx`: Fetches available slots.
    - `src/components/Booking/BookingView.tsx`: Checks slot availability.
- **Insert (Create):**
    - `src/components/Admin/AdminSlotForm.tsx`: Admin creates new slots.
- **Update (Book/Release):**
    - `src/components/Booking/BookingView.tsx`: Marks slot as `is_available: false`.
    - `src/components/Dashboard/DashboardView.tsx`: Releases slot (`is_available: true`) on cancellation.

### Table: `documents`
Used for file metadata.
- **Fetch:**
    - `src/app/documents/page.tsx`: Fetches faculty docs.
    - `src/app/admin/documents/page.tsx`: Fetches admin docs.
    - `src/app/dashboard/documents/page.tsx`: Fetches docs.
- **Insert:**
    - `src/app/admin/documents/page.tsx`: Uploads new document metadata.
- **Delete:**
    - `src/app/admin/documents/page.tsx`: Deletes document.

### Table: `users`
- `src/components/Admin/AdminView.tsx`: Fetches user stats.

### Table: `stocks`
- `src/app/admin/add-stocks/page.tsx`: Fetches stock data.

**Intranet Replacement Strategy:**
- Create an API layer (e.g., `src/services/api.ts`).
- Replace `supabase.from('bookings').select('*')` with `axios.get('/api/bookings')`.

---

## 3. File Storage (`supabase.storage`)
Used for uploading Documents.

**Files to Modify:**
- `src/app/admin/documents/page.tsx`:
    - `supabase.storage.from('documents').upload(...)`
    - `supabase.storage.from('documents').getPublicUrl(...)`

**Intranet Replacement Strategy:**
- Replace with a standard Multipart Form Upload to your Intranet File Server.
- Ensure the server returns a publicly accessible URL (or value accessible within the intranet) for the file.

---

## 4. Environment Variables
The following keys in `.env.local` are specific to Supabase and should be replaced with your Intranet Config:

- `NEXT_PUBLIC_SUPABASE_URL` -> Replace with `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> Remove (likely handled via Intranet Cookies/Tokens)
