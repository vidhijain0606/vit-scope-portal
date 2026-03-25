-- 1. Create the Slots Table (if not exists)
CREATE TABLE IF NOT EXISTS slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

-- 2. Create the Bookings Table (if not exists)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    description TEXT,
    start_time TIME,
    end_time TIME,
    date DATE,
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
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

-- 3. Create the Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Designed for Simplified "Anonymous/Public" Admin Access)

-- --- SLOTS POLICIES ---
CREATE POLICY "Public can view slots" ON slots FOR SELECT TO public USING (true);
CREATE POLICY "Public can update slots" ON slots FOR UPDATE TO public USING (true); -- Needed for booking flow
CREATE POLICY "Public can insert slots" ON slots FOR INSERT TO public WITH CHECK (true); -- For seeding

-- --- BOOKINGS POLICIES ---
CREATE POLICY "Public can view bookings" ON bookings FOR SELECT TO public USING (true);
CREATE POLICY "Public can insert bookings" ON bookings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public can update bookings" ON bookings FOR UPDATE TO public USING (true);

-- --- DOCUMENTS POLICIES ---
-- Allow EVERYONE to VIEW documents
CREATE POLICY "Public can view documents" 
ON documents FOR SELECT 
TO public 
USING (true);

-- Allow PUBLIC (Simulated Admin) to INSERT documents
CREATE POLICY "Admins can upload documents" 
ON documents FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow PUBLIC (Simulated Admin) to DELETE documents
CREATE POLICY "Admins can delete documents" 
ON documents FOR DELETE 
TO public 
USING (true);

-- 6. Storage Bucket Setup
-- Verify bucket exists
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;

-- 7. Storage Policies
-- Allow Viewing Files (Public)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documents');

-- Allow Uploading Files (Public/Anon)
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'documents');

-- Allow Deleting Files (Public/Anon)
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'documents');
