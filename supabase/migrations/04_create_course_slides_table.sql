-- ============================================================================
-- PANS Courseware Hub: Supabase Migration 04
-- Title: Create 'course_slides' table for modular PDF Files & Lecture Slides
-- Description:
-- 1. Creates public.course_slides table linked to public.courses(id) (1:N relationship)
-- 2. Enables Row Level Security (RLS) with public read access
-- 3. Seeds initial lecture unit slides for existing courses
-- ============================================================================

-- 1. Create table: course_slides
CREATE TABLE IF NOT EXISTS public.course_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    unit_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    lecturer TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    total_pages INTEGER DEFAULT 28,
    file_size TEXT DEFAULT '8.4 MB',
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_course_slides_courses FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_slides_course_id ON public.course_slides (course_id);
CREATE INDEX IF NOT EXISTS idx_course_slides_unit_number ON public.course_slides (unit_number);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.course_slides ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Public read access for students
DROP POLICY IF EXISTS "Public can view course slides" ON public.course_slides;
CREATE POLICY "Public can view course slides"
    ON public.course_slides FOR SELECT
    USING (true);

-- 4. RLS Policy: Write access for administrators (service_role & authenticated)
DROP POLICY IF EXISTS "Service role write access on course slides" ON public.course_slides;
CREATE POLICY "Service role write access on course slides"
    ON public.course_slides FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage course slides" ON public.course_slides;
CREATE POLICY "Authenticated users can manage course slides"
    ON public.course_slides FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Seed Data: Insert PCH 401 & PCO 401 initial slide records
INSERT INTO public.course_slides (
    id,
    course_id,
    unit_number,
    title,
    lecturer,
    pdf_url,
    total_pages,
    file_size,
    is_verified
) VALUES
(
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111103', -- PCH401
    1,
    'Introduction to Structure-Activity Relationships (SAR) & Drug Design',
    'Prof. A. Adebayo',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    28,
    '8.4 MB',
    true
),
(
    '44444444-4444-4444-4444-444444444402',
    '11111111-1111-1111-1111-111111111103', -- PCH401
    2,
    'Stereochemical & Electronic Factors in Bioactivity',
    'Dr. O. Adeleke',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    34,
    '11.2 MB',
    true
),
(
    '44444444-4444-4444-4444-444444444403',
    '11111111-1111-1111-1111-111111111103', -- PCH401
    3,
    'SAR of Beta-Lactam & Broad Spectrum Antibiotics',
    'Prof. A. Adebayo',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    42,
    '14.8 MB',
    true
),
(
    '44444444-4444-4444-4444-444444444404',
    '11111111-1111-1111-1111-111111111103', -- PCH401
    4,
    'Rational Design of Antineoplastic & Alkylating Agents',
    'Dr. K. Ibrahim',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    30,
    '9.6 MB',
    true
),
(
    '44444444-4444-4444-4444-444444444405',
    '11111111-1111-1111-1111-111111111104', -- PCO401
    1,
    'Fundamentals of Antimicrobial Chemotherapy & Resistance Mechanisms',
    'Prof. E. Bello',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    36,
    '9.2 MB',
    true
)
ON CONFLICT (id) DO NOTHING;
