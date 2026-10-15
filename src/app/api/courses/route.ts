import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { coursesData } from '@/data/coursesData';
import { normalizeDbCourse } from '@/lib/coursesService';
import { Course, LectureUnit } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      courses: coursesData,
      fromDatabase: false,
      message: 'Supabase credentials not configured in server environment',
    });
  }

  try {
    const { data: dbCourses, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .order('course_code', { ascending: true });

    if (error) {
      return NextResponse.json({
        courses: coursesData,
        fromDatabase: false,
        error: error.message,
        details: error.details,
      });
    }

    if (dbCourses && dbCourses.length > 0) {
      // Query slides
      let slidesByCourse = new Map<string, LectureUnit[]>();
      try {
        const { data: slides, error: sErr } = await supabaseAdmin
          .from('course_slides')
          .select('*');

        if (!sErr && slides) {
          for (const s of slides) {
            const cid = String(s.course_id || s.courseId || s.course_code || '').toLowerCase().trim();
            if (!slidesByCourse.has(cid)) slidesByCourse.set(cid, []);
            slidesByCourse.get(cid)!.push({
              id: s.id,
              unitNumber: s.unit_number || 1,
              title: s.title || `Unit ${s.unit_number || 1}`,
              lecturer: s.lecturer || 'Faculty Lecturer',
              totalPages: s.total_pages || 20,
              fileSize: s.file_size || '8.0 MB',
              pdfUrl: s.pdf_url,
              dateUploaded: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent',
              isVerified: s.is_verified ?? true,
            });
          }
        }
      } catch {
        // Ignore slides error
      }

      const courseMap = new Map<string, Course>();
      for (const local of coursesData) {
        courseMap.set(local.code.toLowerCase().replace(/[^a-z0-9]/g, ''), { ...local });
      }

      for (const row of dbCourses) {
        const code = row.course_code || row.code || '';
        const key = code.toLowerCase().replace(/[^a-z0-9]/g, '');
        const existing = courseMap.get(key);
        const courseSlides = slidesByCourse.get(String(row.id).toLowerCase()) ||
          slidesByCourse.get(key) ||
          [];
        courseSlides.sort((a, b) => a.unitNumber - b.unitNumber);

        courseMap.set(key, normalizeDbCourse(row, courseSlides, existing));
      }

      return NextResponse.json({
        courses: Array.from(courseMap.values()),
        fromDatabase: true,
        count: dbCourses.length,
      });
    }

    return NextResponse.json({
      courses: coursesData,
      fromDatabase: false,
      message: 'Supabase courses table returned 0 rows',
    });
  } catch (err: any) {
    return NextResponse.json({
      courses: coursesData,
      fromDatabase: false,
      error: err?.message || 'Server fetch error',
    });
  }
}
