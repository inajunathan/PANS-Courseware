import { supabase, isSupabaseConfigured } from './supabase';
import { coursesData } from '@/data/coursesData';
import { Course, LectureUnit, AcademicLevel } from '@/types';

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
 * Normalizes course code for dictionary lookup (e.g. "PCH 401" -> "pch401")
 */
function normalizeCodeKey(code: string): string {
  return (code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts academic level string (100-600) from course code digits
 */
function extractLevelFromCode(code: string): AcademicLevel {
  const match = code.match(/([1-6])\d{2}/);
  if (match) {
    return `${match[1]}00` as AcademicLevel;
  }
  return '400';
}

/**
 * Fetches all courses from Supabase 'courses' table joined with 'course_slides',
 * merging seamlessly with local curriculum data so that any courses and slide PDFs
 * uploaded to Supabase immediately appear on the live site.
 */
export async function fetchAllCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured) {
    return coursesData;
  }

  try {
    const { data: dbCourses, error } = await supabase
      .from('courses')
      .select(`
        id,
        course_code,
        course_title,
        department,
        pdf_storage_url,
        created_at,
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
      .order('course_code', { ascending: true });

    if (!error && dbCourses && dbCourses.length > 0) {
      // Build lookup map seeded with local static courses
      const courseMap = new Map<string, Course>();
      for (const local of coursesData) {
        courseMap.set(normalizeCodeKey(local.code), { ...local });
      }

      // Merge Supabase courses into the map
      for (const dbCourse of dbCourses) {
        const key = normalizeCodeKey(dbCourse.course_code);
        const existing = courseMap.get(key);

        const slides: LectureUnit[] = (dbCourse.course_slides || []).map((s: any) => ({
          id: s.id,
          unitNumber: s.unit_number,
          title: s.title,
          lecturer: s.lecturer || 'Faculty Lecturer',
          totalPages: s.total_pages || 20,
          fileSize: s.file_size || '8.0 MB',
          pdfUrl: s.pdf_url || dbCourse.pdf_storage_url,
          dateUploaded: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent',
          isVerified: s.is_verified ?? true,
        }));

        slides.sort((a, b) => a.unitNumber - b.unitNumber);

        if (existing) {
          // Update existing course with Supabase data
          const combinedUnits = slides.length > 0 ? slides : existing.lectureUnits;
          courseMap.set(key, {
            ...existing,
            id: existing.id || dbCourse.id,
            title: dbCourse.course_title || existing.title,
            department: dbCourse.department || existing.department,
            pdf_storage_url: dbCourse.pdf_storage_url || existing.pdf_storage_url,
            lectureUnits: combinedUnits,
            pdfCount: combinedUnits.length > 0 ? combinedUnits.length : (dbCourse.pdf_storage_url ? 1 : existing.pdfCount),
          });
        } else {
          // Brand new course uploaded to Supabase that is not in local seed
          const level = extractLevelFromCode(dbCourse.course_code);
          const slug = dbCourse.course_code.toLowerCase().replace(/\s+/g, '-');
          
          courseMap.set(key, {
            id: slug,
            code: dbCourse.course_code,
            title: dbCourse.course_title || dbCourse.course_code,
            level: level,
            semester: 'First',
            units: 3,
            specialization: dbCourse.department || 'Core Professional',
            description: `Curriculum materials, official lecture slides, and examination archive for ${dbCourse.course_code} - ${dbCourse.course_title}.`,
            leadLecturer: slides[0]?.lecturer || 'Faculty Lecturers',
            department: dbCourse.department || 'Faculty of Pharmacy',
            pdfCount: slides.length > 0 ? slides.length : (dbCourse.pdf_storage_url ? 1 : 0),
            pqCount: 0,
            tutorialCount: 0,
            pdf_storage_url: dbCourse.pdf_storage_url,
            lectureUnits: slides,
          });
        }
      }

      return Array.from(courseMap.values());
    }
  } catch (err) {
    console.warn('Supabase fetchAllCourses error, using local fallback:', err);
  }

  return coursesData;
}

/**
 * Fetches a course with its dynamic slide decks/units from Supabase 'courses' and 'course_slides' tables,
 * gracefully falling back to local dataset if Supabase is unconfigured or not yet populated.
 */
export async function fetchCourseByCode(courseCode: string): Promise<Course | null> {
  const rawCode = (courseCode || '').toLowerCase().trim();
  const normalizedKey = normalizeCodeKey(rawCode);

  const local = coursesData.find(
    (c) =>
      c.id.toLowerCase() === rawCode ||
      normalizeCodeKey(c.code) === normalizedKey ||
      c.code.toLowerCase().replace(/\s+/g, '-') === rawCode
  );

  if (!isSupabaseConfigured) {
    return local || null;
  }

  try {
    const cleanCode = local ? local.code : courseCode.replace(/-/g, ' ');
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
      .or(`course_code.ilike.%${cleanCode}%,course_code.ilike.%${courseCode.replace(/-/g, '')}%`)
      .maybeSingle();

    if (!error && dbCourse) {
      const slides: LectureUnit[] = (dbCourse.course_slides || []).map((s: any) => ({
        id: s.id,
        unitNumber: s.unit_number,
        title: s.title,
        lecturer: s.lecturer || 'Faculty Lecturer',
        totalPages: s.total_pages || 20,
        fileSize: s.file_size || '8.0 MB',
        pdfUrl: s.pdf_url || dbCourse.pdf_storage_url,
        dateUploaded: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent',
        isVerified: s.is_verified ?? true,
      }));

      // Sort slides by unit number
      slides.sort((a, b) => a.unitNumber - b.unitNumber);

      const combinedUnits = slides.length > 0 ? slides : (local?.lectureUnits || []);
      const level = local?.level ?? extractLevelFromCode(dbCourse.course_code);

      return {
        id: local ? local.id : dbCourse.course_code.toLowerCase().replace(/\s+/g, '-'),
        code: dbCourse.course_code || (local?.code ?? courseCode),
        title: dbCourse.course_title || (local?.title ?? courseCode),
        level: level,
        semester: local?.semester ?? 'First',
        units: local?.units ?? 3,
        specialization: local?.specialization ?? 'Core Professional',
        description: local?.description ?? `Official lecture slides and verified syllabus for ${dbCourse.course_code}.`,
        leadLecturer: slides[0]?.lecturer || local?.leadLecturer || 'Faculty Lecturers',
        department: dbCourse.department || (local?.department ?? 'Faculty of Pharmacy'),
        pdfCount: combinedUnits.length > 0 ? combinedUnits.length : (dbCourse.pdf_storage_url ? 1 : 0),
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

export interface UnitWithCourse {
  unit: LectureUnit;
  course: Course;
}

/**
 * Fetches a single lecture unit / slide deck by its ID from Supabase 'course_slides',
 * or falls back to searching local coursesData.
 */
export async function fetchLectureUnitById(unitId: string): Promise<UnitWithCourse | null> {
  const cleanId = (unitId || '').toLowerCase().trim();

  if (isSupabaseConfigured) {
    try {
      const { data: slideRow, error } = await supabase
        .from('course_slides')
        .select(`
          id,
          unit_number,
          title,
          lecturer,
          pdf_url,
          total_pages,
          file_size,
          is_verified,
          created_at,
          courses (
            id,
            course_code,
            course_title,
            department,
            pdf_storage_url
          )
        `)
        .eq('id', unitId)
        .maybeSingle();

      if (!error && slideRow) {
        const dbCourse = Array.isArray(slideRow.courses) ? slideRow.courses[0] : slideRow.courses;
        const courseCode = dbCourse?.course_code || 'PCH 401';
        const level = extractLevelFromCode(courseCode);

        const parentCourse: Course = {
          id: courseCode.toLowerCase().replace(/\s+/g, '-'),
          code: courseCode,
          title: dbCourse?.course_title || courseCode,
          level: level,
          semester: 'First',
          units: 3,
          specialization: dbCourse?.department || 'Faculty of Pharmacy',
          description: `Verified course syllabus for ${courseCode}.`,
          leadLecturer: slideRow.lecturer || 'Faculty Lecturer',
          department: dbCourse?.department || 'Faculty of Pharmacy',
          pdfCount: 1,
          pqCount: 0,
          tutorialCount: 0,
          pdf_storage_url: dbCourse?.pdf_storage_url,
          lectureUnits: [],
        };

        const unit: LectureUnit = {
          id: slideRow.id,
          unitNumber: slideRow.unit_number,
          title: slideRow.title,
          lecturer: slideRow.lecturer,
          totalPages: slideRow.total_pages || 28,
          fileSize: slideRow.file_size || '8.4 MB',
          pdfUrl: slideRow.pdf_url || dbCourse?.pdf_storage_url,
          dateUploaded: slideRow.created_at ? new Date(slideRow.created_at).toLocaleDateString() : 'Recent',
          isVerified: slideRow.is_verified ?? true,
        };

        return { unit, course: parentCourse };
      }
    } catch (err) {
      console.warn('Supabase fetchLectureUnitById error, checking local fallback:', err);
    }
  }

  // Local fallback search
  for (const c of coursesData) {
    const found = c.lectureUnits.find(
      (u) => u.id.toLowerCase() === cleanId || String(u.unitNumber) === cleanId
    );
    if (found) {
      return { unit: found, course: c };
    }
  }

  return null;
}
