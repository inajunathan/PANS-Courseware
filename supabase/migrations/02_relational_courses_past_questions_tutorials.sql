-- ============================================================================
-- Supabase Relational Migration: Courses, Past Questions & Academic Tutorials
-- Description: Establishes a normalized 1:N relational architecture with
-- Foreign Keys, ON DELETE CASCADE, strict RLS, and realistic seed records.
-- ============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    course_title TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_courses_course_code UNIQUE (course_code)
);

CREATE INDEX IF NOT EXISTS idx_courses_course_code ON public.courses (course_code);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses (department);

-- 3. Table: past_questions (re-architected with FK to courses.id)
-- If past_questions already existed without course_id, we add course_id or recreate cleanly.
DO $$
BEGIN
    -- Check if past_questions already exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'past_questions') THEN
        -- Add course_id column if missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'past_questions' AND column_name = 'course_id') THEN
            ALTER TABLE public.past_questions ADD COLUMN course_id UUID;
        END IF;
    ELSE
        CREATE TABLE public.past_questions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_id UUID,
            academic_year TEXT NOT NULL,
            semester TEXT NOT NULL,
            pdf_storage_url TEXT NOT NULL,
            exam_type TEXT DEFAULT 'First Semester Examination',
            has_verified_solutions BOOLEAN DEFAULT true,
            total_pages INTEGER DEFAULT 8,
            file_size TEXT DEFAULT '2.4 MB',
            download_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- Ensure foreign key constraint exists with ON DELETE CASCADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_past_questions_courses'
    ) THEN
        ALTER TABLE public.past_questions
        ADD CONSTRAINT fk_past_questions_courses
        FOREIGN KEY (course_id)
        REFERENCES public.courses(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add check constraint for semester ('1st' or '2nd' or 'First' or 'Second')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_past_questions_semester'
    ) THEN
        ALTER TABLE public.past_questions
        ADD CONSTRAINT chk_past_questions_semester
        CHECK (semester IN ('1st', '2nd', 'First', 'Second'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_past_questions_course_id ON public.past_questions (course_id);
CREATE INDEX IF NOT EXISTS idx_past_questions_academic_year ON public.past_questions (academic_year);

-- 4. Table: tutorials
CREATE TABLE IF NOT EXISTS public.tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL,
    video_url TEXT,
    written_content TEXT,
    tutor_name TEXT,
    duration TEXT,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_tutorials_courses FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
    CONSTRAINT chk_tutorials_content_type CHECK (content_type IN ('video', 'text')),
    CONSTRAINT chk_tutorials_media CHECK (
        (content_type = 'video' AND video_url IS NOT NULL) OR
        (content_type = 'text' AND written_content IS NOT NULL) OR
        (video_url IS NOT NULL OR written_content IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_tutorials_course_id ON public.tutorials (course_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_content_type ON public.tutorials (content_type);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies
-- Public Read-Only (SELECT) for students
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
CREATE POLICY "Public can view courses"
    ON public.courses FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view past questions" ON public.past_questions;
CREATE POLICY "Public can view past questions"
    ON public.past_questions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view tutorials" ON public.tutorials;
CREATE POLICY "Public can view tutorials"
    ON public.tutorials FOR SELECT
    USING (true);

-- Restrict Mutations (INSERT, UPDATE, DELETE) exclusively to service_role
DROP POLICY IF EXISTS "Service role write access on courses" ON public.courses;
CREATE POLICY "Service role write access on courses"
    ON public.courses FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write access on past questions" ON public.past_questions;
CREATE POLICY "Service role write access on past questions"
    ON public.past_questions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write access on tutorials" ON public.tutorials;
CREATE POLICY "Service role write access on tutorials"
    ON public.tutorials FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. Seed Data Insertion
-- Insert Master Courses
INSERT INTO public.courses (id, course_code, course_title, department)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'MTH101', 'Elementary Mathematics I: Calculus & Algebra', 'Department of Mathematics'),
    ('11111111-1111-1111-1111-111111111102', 'CHM101', 'General Physical & Inorganic Chemistry', 'Department of Chemistry'),
    ('11111111-1111-1111-1111-111111111103', 'PCH401', 'Pharmaceutical Chemistry: SAR & Drug Design', 'Department of Pharmaceutical Chemistry'),
    ('11111111-1111-1111-1111-111111111104', 'PCO401', 'Advanced Pharmacology: Chemotherapy & Autacoids', 'Department of Pharmacology & Therapeutics'),
    ('11111111-1111-1111-1111-111111111105', 'PCT401', 'Biopharmaceutics & Applied Pharmacokinetics', 'Department of Pharmaceutics'),
    ('11111111-1111-1111-1111-111111111106', 'PCG301', 'Pharmacognosy & Phytochemistry', 'Department of Pharmacognosy')
ON CONFLICT (course_code) DO UPDATE
SET course_title = EXCLUDED.course_title,
    department = EXCLUDED.department;

-- Insert Past Questions linked via course_id
INSERT INTO public.past_questions (
    id,
    course_id,
    academic_year,
    semester,
    pdf_storage_url,
    exam_type,
    has_verified_solutions,
    total_pages,
    file_size,
    download_count
) VALUES
(
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    '2023/2024',
    '1st',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'First Semester Examination',
    true,
    6,
    '1.8 MB',
    2150
),
(
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111103',
    '2023/2024',
    '1st',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'Degree Examination',
    true,
    8,
    '2.4 MB',
    1890
),
(
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111104',
    '2024/2025',
    '1st',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'Continuous Assessment Test',
    true,
    10,
    '3.1 MB',
    1650
),
(
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111105',
    '2023/2024',
    '2nd',
    'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    'Second Semester Examination',
    true,
    6,
    '1.9 MB',
    980
)
ON CONFLICT (id) DO NOTHING;

-- Insert Academic Tutorials (both Video and Written Text Guides)
INSERT INTO public.tutorials (
    id,
    course_id,
    title,
    content_type,
    video_url,
    written_content,
    tutor_name,
    duration,
    views
) VALUES
(
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111101',
    'Limits and Continuity Explained',
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    NULL,
    'Engr. K. Balogun',
    '32:45',
    4120
),
(
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111101',
    'Comprehensive Differentiation & L''Hôpital''s Rule Study Guide',
    'text',
    NULL,
    E'# Differentiation Techniques\n\n## 1. Definition of the Derivative\n\nThe derivative of a function represents the instantaneous rate of change:\n\n$$f''(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n\n## 2. L''Hôpital''s Rule\n\nWhen evaluating limits yielding indeterminate forms $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$, differentiate numerator and denominator independently:\n\n$$\\lim_{x \\to c} \\frac{f(x)}{g(x)} = \\lim_{x \\to c} \\frac{f''(x)}{g''(x)}$$',
    'Academic Committee Notes',
    '15 min read',
    2890
),
(
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111103',
    'Structure-Activity Relationships (SAR) of Beta-Lactam Antibiotics',
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    NULL,
    'Pharm. David Adeleke',
    '48:15',
    3420
),
(
    '33333333-3333-3333-3333-333333333304',
    '11111111-1111-1111-1111-111111111105',
    'Biopharmaceutics: One-Compartment IV Bolus & Clearance Kinetics',
    'text',
    NULL,
    E'# One-Compartment Open Model\n\n## Elimination Rate Constant ($k_e$)\n\nThe plasma concentration follows first-order elimination decay:\n\n$$C_p = C_0 \\cdot e^{-k_e \\cdot t}$$\n\nTaking the natural logarithm:\n$$\\ln(C_p) = \\ln(C_0) - k_e \\cdot t$$\n\n## Elimination Half-Life ($t_{1/2}$)\n$$t_{1/2} = \\frac{0.693}{k_e}$$',
    'Pharm. Grace Oladipo',
    '20 min read',
    2450
)
ON CONFLICT (id) DO NOTHING;
