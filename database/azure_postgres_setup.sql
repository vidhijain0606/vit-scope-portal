-- Schema for Azure Database for PostgreSQL
-- No public RLS — authorization happens server-side in Next.js API routes
-- (see src/app/api/**), not at the DB layer.

CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    -- One slot per date+time: admin cannot create the same slot twice.
    CONSTRAINT unique_slot_datetime UNIQUE (date, start_time)
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    slot_id UUID REFERENCES slots(id),
    title TEXT,
    description TEXT,
    start_time TIME,
    end_time TIME,
    date DATE,
    status TEXT DEFAULT 'pending',
    student_name TEXT,
    student_reg_no TEXT,
    emp_email TEXT,
    emp_id TEXT,
    emp_name TEXT,
    scholar_id TEXT,
    scholar_name TEXT,
    meeting_type TEXT,
    location TEXT
);

-- Prevents the same slot from being actively double-booked, while still
-- allowing a slot to be booked again after a prior booking on it was
-- cancelled (a plain table-wide UNIQUE(slot_id) would reject that re-booking
-- forever, since the cancelled row keeps the slot_id — see VAPT-11).
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_slot_booking
    ON bookings (slot_id)
    WHERE status != 'cancelled';

CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    blob_url TEXT NOT NULL,
    uploaded_by TEXT
);

CREATE TABLE IF NOT EXISTS stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    status TEXT DEFAULT 'In Stock'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    name TEXT
);

-- Faculty allowed to sign in via Google OAuth (VAPT-15). Managed by the
-- admin through the UI instead of being hardcoded in source, so access
-- changes don't require a code change + redeploy.
CREATE TABLE IF NOT EXISTS allowed_emails (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal-wide admin-controlled feature flags, e.g. freezing/unfreezing
-- bookings for a specific meeting type without touching code or deploying.
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oral Exam bookings are frozen by default — admin must explicitly enable them.
INSERT INTO app_settings (key, value) VALUES ('oral_exam_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
