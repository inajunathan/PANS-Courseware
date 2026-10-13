import { supabase, isSupabaseConfigured } from './supabase';
import { pastQuestionsData } from '@/data/pastQuestionsData';

export interface DbPastQuestion {
  id: string;
  course_code: string;
  course_title: string;
  academic_year: string;
  department: string;
  pdf_storage_url: string;
  exam_type?: string;
  semester?: string;
  has_verified_solutions?: boolean;
  total_pages?: number;
  file_size?: string;
  examiners?: string;
  download_count?: number;
  created_at?: string;
}

export interface PastQuestionFilterOptions {
  courseCode?: string;
  academicYear?: string;
  department?: string;
  semester?: string;
  searchQuery?: string;
  onlyVerified?: boolean;
}

/**
 * Normalizes a local PastQuestion object to the DbPastQuestion schema
 */
function normalizeLocalPq(pq: (typeof pastQuestionsData)[0]): DbPastQuestion {
  return {
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
  };
}

/**
 * Normalizes a Supabase database row (with optional joined courses) to DbPastQuestion
 */
function normalizeDbRow(row: any): DbPastQuestion {
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  const courseCode = row.course_code || course?.course_code || 'PCH 401';
  const courseTitle = row.course_title || course?.course_title || `${courseCode} Examination Paper`;
  const department = row.department || course?.department || 'College of Pharmacy';

  return {
    id: String(row.id),
    course_code: courseCode,
    course_title: courseTitle,
    academic_year: row.academic_year || '2024/2025',
    department: department,
    pdf_storage_url: row.pdf_storage_url || '/sample-past-question.pdf',
    exam_type: row.exam_type || 'Examination Paper',
    semester: row.semester || 'First',
    has_verified_solutions: row.has_verified_solutions ?? true,
    total_pages: row.total_pages || 8,
    file_size: row.file_size || '2.4 MB',
    examiners: row.examiners || 'Departmental Examination Board',
    download_count: row.download_count || 0,
    created_at: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetches past questions dynamically from Supabase `past_questions` table,
 * joined with `courses` table, with graceful fallback to local data if
 * Supabase is unconfigured or not yet populated.
 */
export async function fetchPastQuestions(
  filters: PastQuestionFilterOptions = {}
): Promise<{ data: DbPastQuestion[]; fromDatabase: boolean }> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('past_questions')
        .select(`
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
          download_count,
          created_at,
          courses (
            course_code,
            course_title,
            department
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.courseCode && filters.courseCode !== 'all') {
        const clean = filters.courseCode.trim();
        query = query.or(`course_code.ilike.%${clean}%,course_code.ilike.%${clean.replace(/\s+/g, '')}%`);
      }

      if (filters.academicYear && filters.academicYear !== 'all') {
        query = query.eq('academic_year', filters.academicYear);
      }

      if (filters.department && filters.department !== 'all') {
        query = query.ilike('department', `%${filters.department}%`);
      }

      if (filters.semester && filters.semester !== 'all') {
        query = query.eq('semester', filters.semester);
      }

      if (filters.onlyVerified) {
        query = query.eq('has_verified_solutions', true);
      }

      if (filters.searchQuery?.trim()) {
        const term = filters.searchQuery.trim();
        query = query.or(
          `course_code.ilike.%${term}%,course_title.ilike.%${term}%,department.ilike.%${term}%,academic_year.ilike.%${term}%`
        );
      }

      const { data, error } = await query;

      if (!error && data) {
        if (data.length > 0) {
          return {
            data: data.map(normalizeDbRow),
            fromDatabase: true,
          };
        } else if (
          filters.courseCode ||
          filters.academicYear ||
          filters.department ||
          filters.semester ||
          filters.searchQuery ||
          filters.onlyVerified
        ) {
          // If filters are active and database returned 0 results, respect database filter
          return { data: [], fromDatabase: true };
        }
      }
    } catch (err) {
      console.warn('Supabase past_questions fetch error, using local fallback:', err);
    }
  }

  // Graceful fallback to local seed data
  let fallback = pastQuestionsData.map(normalizeLocalPq);

  if (filters.courseCode && filters.courseCode !== 'all') {
    const q = filters.courseCode.toLowerCase().replace(/\s+/g, '');
    fallback = fallback.filter((p) =>
      p.course_code.toLowerCase().replace(/\s+/g, '').includes(q)
    );
  }

  if (filters.academicYear && filters.academicYear !== 'all') {
    fallback = fallback.filter((p) => p.academic_year === filters.academicYear);
  }

  if (filters.semester && filters.semester !== 'all') {
    fallback = fallback.filter((p) => p.semester === filters.semester);
  }

  if (filters.onlyVerified) {
    fallback = fallback.filter((p) => p.has_verified_solutions);
  }

  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.toLowerCase();
    fallback = fallback.filter(
      (p) =>
        p.course_code.toLowerCase().includes(q) ||
        p.course_title.toLowerCase().includes(q) ||
        p.academic_year.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
    );
  }

  return { data: fallback, fromDatabase: false };
}

/**
 * Fetches all past questions for a specific course code from Supabase
 * or local fallback
 */
export async function fetchPastQuestionsByCourse(courseCode: string): Promise<DbPastQuestion[]> {
  const res = await fetchPastQuestions({ courseCode });
  return res.data;
}

/**
 * Fetches a single past question by ID from Supabase, or local fallback
 */
export async function fetchPastQuestionById(id: string): Promise<DbPastQuestion | null> {
  const cleanId = (id || '').trim();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('past_questions')
        .select(`
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
          download_count,
          created_at,
          courses (
            course_code,
            course_title,
            department
          )
        `)
        .eq('id', cleanId)
        .maybeSingle();

      if (!error && data) {
        return normalizeDbRow(data);
      }
    } catch (err) {
      console.warn('Supabase get past_question by id error:', err);
    }
  }

  const local = pastQuestionsData.find(
    (p, idx) => p.id === cleanId || String(idx + 1) === cleanId
  );
  if (local) {
    return normalizeLocalPq(local);
  }

  return null;
}
