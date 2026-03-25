-- FIX: Allow "Anonymous" (Simulated Admin) to upload documents

-- 1. Drop old restrictive policies (if they exist)
DROP POLICY IF EXISTS "Admins can upload documents" ON documents;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;

-- 2. Update Documents Table Policy to allow PUBLIC inserts
CREATE POLICY "Admins can upload documents" 
ON documents FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow PUBLIC delete as well (since Admin is anon)
CREATE POLICY "Admins can delete documents" 
ON documents FOR DELETE 
TO public 
USING (true);

-- 3. Update Storage Policies to allow PUBLIC inserts
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
TO public 
USING (bucket_id = 'documents');

-- 4. Ensure bucket exists (Manual step is best, but this helps if logic supports it)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;
