-- ============================================================================
-- PANS Courseware Hub: Supabase Migration 05
-- Title: Remove 'unit' and 'lecturer' columns from database
-- Description:
-- Drops unit_number and lecturer columns from course_slides table,
-- and drops lead_lecturer, lecturer, and units columns from courses table.
-- ============================================================================

-- 1. Drop index on unit_number if it exists
DROP INDEX IF EXISTS public.idx_course_slides_unit_number;

-- 2. Drop unit_number and lecturer columns from public.course_slides
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'course_slides' AND column_name = 'unit_number'
    ) THEN
        ALTER TABLE public.course_slides DROP COLUMN unit_number CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'course_slides' AND column_name = 'lecturer'
    ) THEN
        ALTER TABLE public.course_slides DROP COLUMN lecturer CASCADE;
    END IF;
END $$;

-- 3. Drop any lecturer or unit credit columns from public.courses if previously added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'lead_lecturer'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN lead_lecturer CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'lecturer'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN lecturer CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'units'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN units CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'credit_units'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN credit_units CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'creditunits'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN creditunits CASCADE;
    END IF;
END $$;
