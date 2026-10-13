import { supabase, isSupabaseConfigured } from './supabase';
import { coursesData } from '@/data/coursesData';
import { Course, LectureUnit } from '@/types';

export interface DbCourseSlide {
  id: string;
  course_id: string;
  unit_number: number;
  title: string;
  lecturer: string;
  pdf_url: string;
  total_pages?: number;
  file_size?: string;
  is_verified?: boolean;
  created_at?: string;
}

/**
 * Fetches a course with its dynamic slide decks/units from Supabase 'courses' and 'course_slides' tables,
 * gracefully falling back to local dataset if Supabase is unconfigured or not yet populated.
 */
export async function fetchCourseByCode(courseCode: string): Promise<Course | null> {
  const rawCode = (courseCode || '').toLowerCase();
  const local = coursesData.find(
    (c) =>
      c.id.toLowerCase() === rawCode ||
      c.code.toLowerCase().replace(/\s+/g, '-') === rawCode
  );

  if (!isSupabaseConfigured) {
    return local || null;
  }

  try {
    const cleanCode = local ? local.code : courseCode.replace('-', ' ');
    const { data: dbCourse, error } = await supabase
      .from('courses')
      .select(`
        id,
        course_code,
        course_title,
        department,
        pdf_storage_url,
        course_slides (
          id,
          unit_number,
          title,
          lecturer,
          pdf_url,
          total_pages,
          file_size,
          is_verified,
          created_at
        )
      `)
      .ilike('course_code', cleanCode)
      .maybeSingle();

    if (!error && dbCourse) {
      const slides: LectureUnit[] = (dbCourse.course_slides || []).map((s: any) => ({
        id: s.id,
        unitNumber: s.unit_number,
        title: s.title,
        lecturer: s.lecturer,
        totalPages: s.total_pages || 20,
        fileSize: s.file_size || '8.0 MB',
        pdfUrl: s.pdf_url,
        dateUploaded: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent',
        isVerified: s.is_verified ?? true,
      }));

      // Sort slides by unit number
      slides.sort((a, b) => a.unitNumber - b.unitNumber);

      const combinedUnits = slides.length > 0 ? slides : (local?.lectureUnits || []);

      return {
        id: local ? local.id : dbCourse.id,
        code: dbCourse.course_code || (local?.code ?? courseCode),
        title: dbCourse.course_title || (local?.title ?? courseCode),
        level: local?.level ?? '400',
        semester: local?.semester ?? 'First',
        units: local?.units ?? 3,
        specialization: local?.specialization ?? 'Core Professional',
        description: local?.description ?? 'Pharmacy courseware lecture materials and verified slide decks.',
        leadLecturer: local?.leadLecturer ?? 'Faculty Lecturers',
        department: dbCourse.department || (local?.department ?? 'Faculty of Pharmacy'),
        pdfCount: combinedUnits.length,
        pqCount: local?.pqCount ?? 0,
        tutorialCount: local?.tutorialCount ?? 0,
        pdf_storage_url: dbCourse.pdf_storage_url,
        lectureUnits: combinedUnits,
      };
    }
  } catch (err) {
    console.warn('Supabase course fetch error, using local fallback:', err);
  }

  return local || null;
}
