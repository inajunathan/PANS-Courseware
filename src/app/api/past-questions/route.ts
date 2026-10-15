import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { pastQuestionsData } from '@/data/pastQuestionsData';
import { normalizeDbPastQuestion } from '@/lib/pastQuestionsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      data: pastQuestionsData.map((pq) => ({
        id: pq.id,
        course_code: pq.courseCode,
        course_title: pq.courseTitle,
        academic_year: pq.session.replace(' Session', '').trim(),
        department: 'College of Pharmacy',
        pdf_storage_url: '/sample-past-question.pdf',
        exam_type: pq.examType,
        semester: pq.semester,
        has_verified_solutions: pq.hasVerifiedSolutions,
        total_pages: pq.totalPages,
        file_size: pq.fileSize,
        examiners: pq.examiners,
        download_count: pq.downloadCount,
        created_at: new Date().toISOString(),
      })),
      fromDatabase: false,
      message: 'Supabase credentials not configured in server environment',
    });
  }

  try {
    const { data: dbPqs, error } = await supabaseAdmin
      .from('past_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        data: [],
        fromDatabase: false,
        error: error.message,
        details: error.details,
      });
    }

    if (dbPqs && dbPqs.length > 0) {
      return NextResponse.json({
        data: dbPqs.map(normalizeDbPastQuestion),
        fromDatabase: true,
        count: dbPqs.length,
      });
    }

    return NextResponse.json({
      data: [],
      fromDatabase: false,
      message: 'Supabase past_questions table returned 0 rows',
    });
  } catch (err: any) {
    return NextResponse.json({
      data: [],
      fromDatabase: false,
      error: err?.message || 'Server fetch error',
    });
  }
}
