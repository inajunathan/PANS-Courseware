-- ============================================================================
-- PANS Courseware Hub: Supabase Fix for "permission denied for table courses"
-- Error Code: 42501
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/yvbyqrmfdlpynensanbc
-- 2. Go to "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run" (or Ctrl+Enter)
-- 4. Reload your live Vercel site at: https://pans-courseware.vercel.app/courses
-- ============================================================================

-- 1. Grant public schema usage and SELECT permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- 2. Enable Row Level Security (RLS) on all tables and grant public read policies
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.course_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view course slides" ON public.course_slides;
CREATE POLICY "Public can view course slides" ON public.course_slides FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.past_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view past questions" ON public.past_questions;
CREATE POLICY "Public can view past questions" ON public.past_questions FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.tutorials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view tutorials" ON public.tutorials;
CREATE POLICY "Public can view tutorials" ON public.tutorials FOR SELECT USING (true);

-- 3. Ensure pdf_storage_url column exists on courses table
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS pdf_storage_url TEXT;

-- 4. Verify storage bucket permissions for public downloads and streaming
INSERT INTO storage.buckets (id, name, public)
VALUES ('courses', 'courses', true), ('past-questions', 'past-questions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read storage objects" ON storage.objects;
CREATE POLICY "Public read storage objects"
ON storage.objects FOR SELECT
USING (bucket_id IN ('courses', 'past-questions'));
