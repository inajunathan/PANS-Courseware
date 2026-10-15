import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, getSupabaseConfigStatus } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getSupabaseConfigStatus();

  const report: any = {
    timestamp: new Date().toISOString(),
    environment: {
      isConfigured: config.isConfigured,
      urlConfigured: config.urlConfigured,
      anonKeyConfigured: config.anonKeyConfigured,
      serviceKeyConfigured: config.serviceKeyConfigured,
      projectHost: config.projectHost,
    },
    tables: {
      courses: { checked: false },
      course_slides: { checked: false },
      past_questions: { checked: false },
    },
    storage: {
      checked: false,
    },
    diagnostics: [] as string[],
    recommendations: [] as string[],
  };

  if (!config.isConfigured) {
    report.diagnostics.push('Supabase environment variables are missing or set to placeholder values.');
    report.recommendations.push(
      'In Vercel Dashboard -> Project Settings -> Environment Variables, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then trigger a Redeploy.'
    );
    return NextResponse.json(report, { status: 200 });
  }

  // 1. Test 'courses' table
  try {
    const { data, error, count } = await supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact' });

    if (error) {
      report.tables.courses = {
        checked: true,
        success: false,
        error: error.message,
        details: error.details,
        code: error.code,
      };
      report.diagnostics.push(`Error querying "courses" table: ${error.message}`);
      if (error.code === '42P01') {
        report.recommendations.push('Table "courses" does not exist. Run migration 02 in your Supabase SQL Editor.');
      } else if (error.code === '42501' || error.message?.includes('permission denied')) {
        report.recommendations.push('Permission denied on "courses" table (Error 42501). Copy & paste the SQL from the "sqlFix" field below into your Supabase Dashboard -> SQL Editor, then click Run.');
        report.sqlFix = `-- 1. Grant public schema usage and SELECT permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- 2. Ensure Row Level Security (RLS) allows public reading for courses, slides, and past questions
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

-- 3. Ensure pdf_storage_url column exists
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS pdf_storage_url TEXT;`;
      }
    } else {
      report.tables.courses = {
        checked: true,
        success: true,
        rowCount: data?.length || 0,
        sampleCourses: (data || []).slice(0, 3).map((c: any) => ({
          code: c.course_code || c.code,
          title: c.course_title || c.title,
        })),
      };
      if (!data || data.length === 0) {
        report.diagnostics.push('Query succeeded, but "courses" table has 0 rows or RLS is hiding them.');
        report.recommendations.push('If you already inserted courses, ensure RLS public read policy is enabled: CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);');
      }
    }
  } catch (ex: any) {
    report.tables.courses = { checked: true, success: false, exception: ex.message };
  }

  // 2. Test 'course_slides' table
  try {
    const { data, error } = await supabaseAdmin
      .from('course_slides')
      .select('*');

    if (error) {
      report.tables.course_slides = {
        checked: true,
        success: false,
        error: error.message,
      };
    } else {
      report.tables.course_slides = {
        checked: true,
        success: true,
        rowCount: data?.length || 0,
        sampleSlides: (data || []).slice(0, 3).map((s: any) => ({
          title: s.title,
          unit: s.unit_number,
        })),
      };
    }
  } catch (ex: any) {
    report.tables.course_slides = { checked: true, success: false, exception: ex.message };
  }

  // 3. Test 'past_questions' table
  try {
    const { data, error } = await supabaseAdmin
      .from('past_questions')
      .select('*');

    if (error) {
      report.tables.past_questions = {
        checked: true,
        success: false,
        error: error.message,
      };
    } else {
      report.tables.past_questions = {
        checked: true,
        success: true,
        rowCount: data?.length || 0,
        sampleQuestions: (data || []).slice(0, 3).map((pq: any) => ({
          code: pq.course_code || pq.code,
          year: pq.academic_year || pq.session,
        })),
      };
    }
  } catch (ex: any) {
    report.tables.past_questions = { checked: true, success: false, exception: ex.message };
  }

  // 4. Test Storage Buckets
  try {
    const { data: buckets, error: bError } = await supabaseAdmin.storage.listBuckets();
    if (bError) {
      report.storage = { checked: true, success: false, error: bError.message };
    } else {
      const coursesBucket = buckets?.find((b) => b.id === 'courses' || b.name === 'courses');
      const pqBucket = buckets?.find((b) => b.id === 'past-questions' || b.name === 'past-questions');
      report.storage = {
        checked: true,
        success: true,
        allBuckets: (buckets || []).map((b) => ({ id: b.id, name: b.name, public: b.public })),
        coursesBucketFound: Boolean(coursesBucket),
        coursesBucketPublic: Boolean(coursesBucket?.public),
        pastQuestionsBucketFound: Boolean(pqBucket),
        pastQuestionsBucketPublic: Boolean(pqBucket?.public),
      };
      if (coursesBucket && !coursesBucket.public) {
        report.recommendations.push('The "courses" storage bucket is marked private. Go to Supabase Storage -> Edit Bucket and toggle "Public Bucket" to ON.');
      }
      if (pqBucket && !pqBucket.public) {
        report.recommendations.push('The "past-questions" storage bucket is marked private. Go to Supabase Storage -> Edit Bucket and toggle "Public Bucket" to ON.');
      }
    }
  } catch (ex: any) {
    report.storage = { checked: true, success: false, exception: ex.message };
  }

  return NextResponse.json(report, { status: 200 });
}
