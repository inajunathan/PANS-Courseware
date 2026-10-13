-- ============================================================================
-- PANS Courseware Hub: Supabase Migration 03
-- Title: Add 'courses' Storage Bucket & 'pdf_storage_url' to courses table
-- Description:
-- 1. Adds 'pdf_storage_url' column to public.courses
-- 2. Sets up public Supabase Storage bucket 'courses' (50MB PDF limit)
-- 3. Configures Storage RLS policies for public reading and authenticated uploads
-- ============================================================================

-- 1. Add pdf_storage_url column to public.courses if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'courses' 
          AND column_name = 'pdf_storage_url'
    ) THEN
        ALTER TABLE public.courses ADD COLUMN pdf_storage_url TEXT;
        RAISE NOTICE 'Added pdf_storage_url column to public.courses';
    ELSE
        RAISE NOTICE 'Column pdf_storage_url already exists in public.courses';
    END IF;
END $$;

-- 2. Setup the public 'courses' bucket in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'courses',
    'courses',
    true,
    52428800, -- 50MB maximum per file
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf'];

-- 3. Storage RLS Policies: Allow public read access to course PDF documents
DROP POLICY IF EXISTS "Public Access to Course PDFs" ON storage.objects;
CREATE POLICY "Public Access to Course PDFs"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'courses');

-- 4. Storage RLS Policies: Allow authenticated administrators to upload course PDFs
DROP POLICY IF EXISTS "Authenticated Users Can Upload Course PDFs" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload Course PDFs"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'courses');

DROP POLICY IF EXISTS "Authenticated Users Can Update Course PDFs" ON storage.objects;
CREATE POLICY "Authenticated Users Can Update Course PDFs"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'courses');

DROP POLICY IF EXISTS "Authenticated Users Can Delete Course PDFs" ON storage.objects;
CREATE POLICY "Authenticated Users Can Delete Course PDFs"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'courses');
