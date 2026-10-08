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
    academic_year: pq.session.replace(' Session', ''),
    department: 'College of Pharmacy',
    pdf_storage_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    exam_type: pq.examType,
    semester: pq.semester,
    has_verified_solutions: pq.hasVerifiedSolutions,
    total_pages: pq.totalPages,
    file_size: pq.fileSize,
    examiners: pq.examiners,
    download_count: pq.downloadCount,
    created_at: new Date().toISOString()
  };
}

/**
 * Fetches past questions dynamically from Supabase `past_questions` table,
 * with graceful fallback to local data if Supabase is unconfigured or returns empty.
 */
export async function fetchPastQuestions(
  filters: PastQuestionFilterOptions = {}
): Promise<{ data: DbPastQuestion[]; fromDatabase: boolean }> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('past_questions')
        .select('*')
        .order('academic_year', { ascending: false });

      if (filters.courseCode && filters.courseCode !== 'all') {
        query = query.ilike('course_code', `%${filters.courseCode}%`);
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

      if (!error && data && data.length > 0) {
        return { data: data as DbPastQuestion[], fromDatabase: true };
      }
    } catch (err) {
      console.warn('Supabase fetch error, using local fallback:', err);
    }
  }

  // Graceful fallback to local seed data
  let fallback = pastQuestionsData.map(normalizeLocalPq);

  if (filters.courseCode && filters.courseCode !== 'all') {
    fallback = fallback.filter((p) =>
      p.course_code.toLowerCase().includes(filters.courseCode!.toLowerCase())
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
 * Fetches a single past question by ID from Supabase, or local fallback
 */
export async function fetchPastQuestionById(id: string): Promise<DbPastQuestion | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('past_questions')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as DbPastQuestion;
      }
    } catch (err) {
      console.warn('Supabase get by id error:', err);
    }
  }

  const local = pastQuestionsData.find((p, idx) => p.id === id || String(idx + 1) === id);
  if (local) {
    return normalizeLocalPq(local);
  }

  return null;
}
