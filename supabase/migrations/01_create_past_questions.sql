-- ============================================================================
-- PANS Courseware Hub: Supabase Database Migration
-- Table: past_questions
-- Zero-Cost Storage: Supabase Storage Bucket 'past-questions'
-- ============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the past_questions table
CREATE TABLE IF NOT EXISTS public.past_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    course_title TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    department TEXT NOT NULL,
    pdf_storage_url TEXT NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'First Semester Examination',
    semester TEXT NOT NULL DEFAULT 'First',
    has_verified_solutions BOOLEAN NOT NULL DEFAULT true,
    total_pages INTEGER DEFAULT 8,
    file_size TEXT DEFAULT '2.4 MB',
    examiners TEXT DEFAULT 'Departmental Examination Board',
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add Indexes for high-performance querying and filtering
CREATE INDEX IF NOT EXISTS idx_past_questions_course_code ON public.past_questions (course_code);
CREATE INDEX IF NOT EXISTS idx_past_questions_academic_year ON public.past_questions (academic_year);
CREATE INDEX IF NOT EXISTS idx_past_questions_department ON public.past_questions (department);
CREATE INDEX IF NOT EXISTS idx_past_questions_semester ON public.past_questions (semester);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;

-- 5. Create policy: Allow public read access to all students (anonymous and authenticated)
DROP POLICY IF EXISTS "Allow public read access to past_questions" ON public.past_questions;
CREATE POLICY "Allow public read access to past_questions"
    ON public.past_questions
    FOR SELECT
    USING (true);

-- 6. Create policy: Only authenticated administrators can insert/update/delete
DROP POLICY IF EXISTS "Allow admin write access to past_questions" ON public.past_questions;
CREATE POLICY "Allow admin write access to past_questions"
    ON public.past_questions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Setup Supabase Storage Bucket for zero-cost PDF hosting
-- Creates the public 'past-questions' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'past-questions',
    'past-questions',
    true,
    52428800, -- 50MB maximum per file
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf'];

-- 8. Storage RLS Policies: Allow public download/preview of PDF files
DROP POLICY IF EXISTS "Public Access to Past Questions PDFs" ON storage.objects;
CREATE POLICY "Public Access to Past Questions PDFs"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'past-questions');

DROP POLICY IF EXISTS "Authenticated Users Can Upload Past Questions PDFs" ON storage.objects;
CREATE POLICY "Authenticated Users Can Upload Past Questions PDFs"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'past-questions');

-- 9. Insert Realistic Seed Data for Pharmacy Faculty Courses
INSERT INTO public.past_questions (
    id,
    course_code,
    course_title,
    academic_year,
    department,
    pdf_storage_url,
    exam_type,
    semester,
    has_verified_solutions,
    total_pages,
    file_size,
    examiners,
    download_count
) VALUES
(
    '0263cf98-7fc3-4903-aa50-7e43af328801',
    'PCH 401',
    'Pharmaceutical Chemistry: SAR & Drug Design',
    '2024/2025',
    'Department of Pharmaceutical Chemistry',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'First Semester Examination',
    'First',
    true,
    8,
    '2.4 MB',
    'Prof. A. Adebayo & Dr. O. Adeleke',
    1420
),
(
    '0263cf98-7fc3-4903-aa50-7e43af328802',
    'PCH 401',
    'Pharmaceutical Chemistry: SAR & Drug Design',
    '2023/2024',
    'Department of Pharmaceutical Chemistry',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'First Semester Examination',
    'First',
    true,
    7,
    '1.9 MB',
    'Prof. A. Adebayo',
    1890
),
(
    '0263cf98-7fc3-4903-aa50-7e43af328803',
    'PCO 401',
    'Advanced Pharmacology: Chemotherapy & Autacoids',
    '2024/2025',
    'Department of Pharmacology & Therapeutics',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'First Semester Examination',
    'First',
    true,
    10,
    '3.1 MB',
    'Prof. (Mrs.) E. Bello & Dr. T. Okafor',
    1650
),
(
    '0263cf98-7fc3-4903-aa50-7e43af328804',
    'PCT 401',
    'Biopharmaceutics & Applied Pharmacokinetics',
    '2023/2024',
    'Department of Pharmaceutics',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'Second Semester Examination',
    'Second',
    true,
    6,
    '1.8 MB',
    'Dr. S. O. Balogun',
    980
),
(
    '0263cf98-7fc3-4903-aa50-7e43af328805',
    'PCG 301',
    'Pharmacognosy & Phytochemistry',
    '2024/2025',
    'Department of Pharmacognosy',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'First Semester Examination',
    'First',
    true,
    6,
    '1.7 MB',
    'Dr. F. O. Akintola',
    1120
),
(
    '0263cf98-7fc3-4903-aa50-7e43af328806',
    'CHM 101',
    'General Physical & Inorganic Chemistry',
    '2024/2025',
    'Department of Chemistry',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'First Semester Examination',
    'First',
    true,
    12,
    '3.6 MB',
    'Faculty Examination Committee',
    3450
),
(
    '0263cf98-7fc3-4903-aa50-7e43af328807',
    'PCP 501',
    'Clinical Pharmacokinetics & Therapeutic Drug Monitoring',
    '2024/2025',
    'Department of Clinical Pharmacy',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'First Semester Examination',
    'First',
    true,
    8,
    '2.3 MB',
    'Pharm. (Dr.) B. A. Ogundele',
    1230
),
(
    '0263cf98-7fc3-4903-aa50-7e43af328808',
    'PCP 601',
    'Advanced Pharmacotherapy & Clinical Ward Rounds',
    '2024/2025',
    'Department of Clinical Pharmacy',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'Professional Board Mock',
    'First',
    true,
    14,
    '4.2 MB',
    'PANS Professional Mock Board',
    950
)
ON CONFLICT (id) DO NOTHING;
