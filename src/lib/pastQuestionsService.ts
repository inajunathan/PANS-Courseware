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
 * Normalizes a Supabase database row to DbPastQuestion
 */
export function normalizeDbPastQuestion(row: any): DbPastQuestion {
  const courseCode = (row.course_code || row.code || row.courseCode || 'PCH 401').trim();
  const courseTitle = (row.course_title || row.title || row.courseTitle || `${courseCode} Examination Paper`).trim();
  const department = (row.department || row.dept || 'College of Pharmacy').trim();
  const academicYear = (row.academic_year || row.academicYear || row.year || row.session || '2024/2025').trim();

  return {
    id: String(row.id),
    course_code: courseCode,
    course_title: courseTitle,
    academic_year: academicYear,
    department: department,
    pdf_storage_url: row.pdf_storage_url || row.pdf_url || row.url || '/sample-past-question.pdf',
    exam_type: row.exam_type || row.examType || 'Examination Paper',
    semester: row.semester || 'First',
    has_verified_solutions: row.has_verified_solutions ?? true,
    total_pages: row.total_pages || row.totalPages || 8,
    file_size: row.file_size || row.fileSize || '2.4 MB',
    examiners: row.examiners || 'Departmental Examination Board',
    download_count: row.download_count || row.downloadCount || 0,
    created_at: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetches past questions dynamically from Supabase `past_questions` table,
 * with graceful fallback to local data if Supabase is unconfigured or not yet populated.
 */
export async function fetchPastQuestions(
  filters: PastQuestionFilterOptions = {}
): Promise<{ data: DbPastQuestion[]; fromDatabase: boolean }> {
  // 1. Direct Supabase Query
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('past_questions')
        .select('*');

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
          console.log(`✅ Loaded ${data.length} past questions from Supabase`);
          return {
            data: data.map(normalizeDbPastQuestion),
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
      } else if (error) {
        console.error('❌ Supabase past_questions error:', error.message, error.details);
      }
    } catch (err) {
      console.warn('Supabase past_questions fetch error, using local fallback:', err);
    }
  }

  // 2. Client-side fetch to server route /api/past-questions if in browser
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/past-questions');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0 && json.fromDatabase) {
          let list: DbPastQuestion[] = json.data;

          if (filters.courseCode && filters.courseCode !== 'all') {
            const q = filters.courseCode.toLowerCase().replace(/\s+/g, '');
            list = list.filter((p) => p.course_code.toLowerCase().replace(/\s+/g, '').includes(q));
          }

          if (filters.academicYear && filters.academicYear !== 'all') {
            list = list.filter((p) => p.academic_year === filters.academicYear);
          }

          if (filters.semester && filters.semester !== 'all') {
            list = list.filter((p) => p.semester === filters.semester);
          }

          if (filters.onlyVerified) {
            list = list.filter((p) => p.has_verified_solutions);
          }

          return { data: list, fromDatabase: true };
        }
      }
    } catch {
      // Ignore API route error, proceed to fallback
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
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (!error && data) {
        return normalizeDbPastQuestion(data);
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
