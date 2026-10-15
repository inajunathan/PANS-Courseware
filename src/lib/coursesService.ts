import { supabase, isSupabaseConfigured } from './supabase';
import { coursesData } from '@/data/coursesData';
import { Course, LectureUnit, AcademicLevel, Semester, Specialization } from '@/types';

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
  const match = (code || '').match(/([1-6])\d{2}/);
  if (match) {
    return `${match[1]}00` as AcademicLevel;
  }
  return '400';
}

/**
 * Normalizes any database row (whether using course_code/code/title/name) to standard Course object
 */
export function normalizeDbCourse(
  row: any,
  slides: LectureUnit[] = [],
  localFallback?: Course
): Course {
  const code = (row.course_code || row.code || row.courseCode || localFallback?.code || 'PCH 401').trim();
  const title = (row.course_title || row.title || row.courseTitle || row.name || localFallback?.title || code).trim();
  const department = (row.department || row.dept || localFallback?.department || 'Faculty of Pharmacy').trim();
  const level: AcademicLevel = row.level 
    ? (String(row.level).replace(/L$/i, '') as AcademicLevel)
    : (localFallback?.level ?? extractLevelFromCode(code));
  const semester: Semester = (row.semester || localFallback?.semester || 'First') as Semester;
  const units = Number(row.units || row.credit_units || row.creditUnits || localFallback?.units || 3);
  const specialization = (row.specialization || department || localFallback?.specialization || 'Core Professional') as Specialization;
  const description = row.description || localFallback?.description || `Curriculum materials, official lecture slides, and examination archive for ${code} - ${title}.`;
  const leadLecturer = row.lead_lecturer || row.lecturer || slides[0]?.lecturer || localFallback?.leadLecturer || 'Faculty Lecturers';
  const pdfStorageUrl = row.pdf_storage_url || row.pdf_url || row.pdfUrl || localFallback?.pdf_storage_url;

  const combinedUnits = slides.length > 0 ? slides : (localFallback?.lectureUnits || []);
  const pdfCount = combinedUnits.length > 0 ? combinedUnits.length : (pdfStorageUrl ? 1 : (localFallback?.pdfCount || 0));

  return {
    id: localFallback ? localFallback.id : code.toLowerCase().replace(/\s+/g, '-'),
    code,
    title,
    level,
    semester,
    units,
    specialization,
    description,
    leadLecturer,
    department,
    pdfCount,
    pqCount: localFallback?.pqCount ?? 0,
    tutorialCount: localFallback?.tutorialCount ?? 0,
    pdf_storage_url: pdfStorageUrl,
    lectureUnits: combinedUnits,
  };
}

/**
 * Fetches all courses from Supabase 'courses' table, merging with slide decks
 * and graceful fallback to local data.
 * Also queries the server /api/courses fallback if client-side inlined env vars are absent.
 */
export async function fetchAllCourses(): Promise<Course[]> {
  // 1. Direct Supabase Query (when configured)
  if (isSupabaseConfigured) {
    try {
      const { data: dbCourses, error } = await supabase
        .from('courses')
        .select('*');

      if (error) {
        console.error('❌ Supabase "courses" query returned an error:', error.message, error.details, error.hint);
      } else if (dbCourses && dbCourses.length > 0) {
        console.log(`✅ Loaded ${dbCourses.length} courses directly from Supabase`);

        // Fetch slide units safely (doesn't block courses if table not yet created)
        const slidesByCourse = new Map<string, LectureUnit[]>();
        try {
          const { data: slides, error: sErr } = await supabase
            .from('course_slides')
            .select('*');

          if (!sErr && slides && slides.length > 0) {
            for (const s of slides) {
              const cid = String(s.course_id || s.courseId || s.course_code || '').toLowerCase().trim();
              if (!slidesByCourse.has(cid)) slidesByCourse.set(cid, []);
              slidesByCourse.get(cid)!.push({
                id: s.id,
                unitNumber: s.unit_number || s.unitNumber || 1,
                title: s.title || `Unit ${s.unit_number || 1}`,
                lecturer: s.lecturer || 'Faculty Lecturer',
                totalPages: s.total_pages || s.totalPages || 20,
                fileSize: s.file_size || s.fileSize || '8.0 MB',
                pdfUrl: s.pdf_url || s.pdfUrl,
                dateUploaded: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent',
                isVerified: s.is_verified ?? true,
              });
            }
          }
        } catch (sEx) {
          console.warn('Optional course_slides query skipped:', sEx);
        }

        // Build lookup map seeded with local static courses
        const courseMap = new Map<string, Course>();
        for (const local of coursesData) {
          courseMap.set(normalizeCodeKey(local.code), { ...local });
        }

        // Merge Supabase courses
        for (const dbCourse of dbCourses) {
          const code = dbCourse.course_code || dbCourse.code || '';
          const key = normalizeCodeKey(code);
          const existing = courseMap.get(key);

          // Find slides matching by id or course_code
          const courseSlides = slidesByCourse.get(String(dbCourse.id).toLowerCase()) ||
            slidesByCourse.get(key) ||
            [];
          courseSlides.sort((a, b) => a.unitNumber - b.unitNumber);

          const merged = normalizeDbCourse(dbCourse, courseSlides, existing);
          courseMap.set(key, merged);
        }

        return Array.from(courseMap.values());
      } else {
        console.warn('⚠️ Supabase "courses" table query returned 0 rows. Check RLS SELECT policy in Supabase SQL editor.');
      }
    } catch (err) {
      console.error('❌ Supabase direct fetchAllCourses exception:', err);
    }
  }

  // 2. Client-side fetch to server route /api/courses if running in the browser
  // This allows the server to query Supabase (bypassing missing browser inlined env vars or CORS)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const json = await res.json();
        if (json.courses && json.courses.length > 0 && json.fromDatabase) {
          console.log(`✅ Loaded ${json.courses.length} courses from /api/courses server endpoint`);
          return json.courses;
        }
      }
    } catch (apiErr) {
      // Ignore API route error, proceed to fallback
    }
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
    const codeNoSpaces = cleanCode.replace(/\s+/g, '');

    // Select without restrictive nested joins so it never fails on relation cache
    const { data: dbCourse, error } = await supabase
      .from('courses')
      .select('*')
      .or(`course_code.ilike.%${cleanCode}%,course_code.ilike.%${codeNoSpaces}%`)
      .maybeSingle();

    if (!error && dbCourse) {
      // Fetch slide units for this course
      let slides: LectureUnit[] = [];
      try {
        const { data: slidesData, error: sErr } = await supabase
          .from('course_slides')
          .select('*')
          .eq('course_id', dbCourse.id)
          .order('unit_number', { ascending: true });

        if (!sErr && slidesData) {
          slides = slidesData.map((s: any) => ({
            id: s.id,
            unitNumber: s.unit_number || 1,
            title: s.title || `Unit ${s.unit_number || 1}`,
            lecturer: s.lecturer || 'Faculty Lecturer',
            totalPages: s.total_pages || 20,
            fileSize: s.file_size || '8.0 MB',
            pdfUrl: s.pdf_url || dbCourse.pdf_storage_url,
            dateUploaded: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent',
            isVerified: s.is_verified ?? true,
          }));
        }
      } catch (sEx) {
        console.warn('Optional course_slides by course_id query:', sEx);
      }

      return normalizeDbCourse(dbCourse, slides, local);
    }
  } catch (err) {
    console.warn('Supabase fetchCourseByCode error, using local fallback:', err);
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
        .select('*')
        .eq('id', unitId)
        .maybeSingle();

      if (!error && slideRow) {
        let parentCourse: Course | null = null;
        if (slideRow.course_id) {
          const { data: courseRow } = await supabase
            .from('courses')
            .select('*')
            .eq('id', slideRow.course_id)
            .maybeSingle();
          if (courseRow) {
            parentCourse = normalizeDbCourse(courseRow, []);
          }
        }

        const courseCode = parentCourse?.code || 'PCH 401';
        const level = extractLevelFromCode(courseCode);

        const fallbackCourse: Course = parentCourse || {
          id: courseCode.toLowerCase().replace(/\s+/g, '-'),
          code: courseCode,
          title: courseCode,
          level: level,
          semester: 'First',
          units: 3,
          specialization: 'Core Professional',
          description: `Verified course syllabus for ${courseCode}.`,
          leadLecturer: slideRow.lecturer || 'Faculty Lecturer',
          department: 'Faculty of Pharmacy',
          pdfCount: 1,
          pqCount: 0,
          tutorialCount: 0,
          pdf_storage_url: slideRow.pdf_url,
          lectureUnits: [],
        };

        const unit: LectureUnit = {
          id: slideRow.id,
          unitNumber: slideRow.unit_number || 1,
          title: slideRow.title || 'Lecture Slides',
          lecturer: slideRow.lecturer || 'Faculty Lecturer',
          totalPages: slideRow.total_pages || 28,
          fileSize: slideRow.file_size || '8.4 MB',
          pdfUrl: slideRow.pdf_url || fallbackCourse.pdf_storage_url,
          dateUploaded: slideRow.created_at ? new Date(slideRow.created_at).toLocaleDateString() : 'Recent',
          isVerified: slideRow.is_verified ?? true,
        };

        return { unit, course: fallbackCourse };
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
