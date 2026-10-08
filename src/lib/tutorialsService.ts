import { supabase, isSupabaseConfigured } from './supabase';
import { tutorialsData } from '@/data/tutorialsData';

export interface DbTutorial {
  id: string;
  course_id: string;
  title: string;
  content_type: 'video' | 'text';
  video_url?: string | null;
  written_content?: string | null;
  tutor_name?: string | null;
  duration?: string | null;
  views?: number;
  created_at?: string;
  course_code?: string;
  course_title?: string;
  department?: string;
  courses?: {
    course_code: string;
    course_title: string;
    department: string;
  };
}

export interface TutorialFilterOptions {
  courseCode?: string;
  contentType?: 'video' | 'text' | 'all';
  searchQuery?: string;
}

/**
 * Normalizes local tutorial items to relational DbTutorial
 */
function normalizeLocalTutorial(tut: (typeof tutorialsData)[0]): DbTutorial {
  return {
    id: tut.id,
    course_id: '11111111-1111-1111-1111-111111111103',
    title: tut.title,
    content_type: 'video',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    written_content: null,
    tutor_name: `${tut.tutor} (${tut.tutorRole})`,
    duration: tut.duration,
    views: tut.views,
    course_code: tut.courseCode,
    course_title: tut.category,
    department: 'Department of Pharmaceutical Chemistry',
    created_at: new Date().toISOString()
  };
}

/**
 * Fetches tutorials dynamically from Supabase `tutorials` table joined with `courses`
 */
export async function fetchTutorials(
  filters: TutorialFilterOptions = {}
): Promise<{ data: DbTutorial[]; fromDatabase: boolean }> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('tutorials')
        .select(`
          id,
          course_id,
          title,
          content_type,
          video_url,
          written_content,
          tutor_name,
          duration,
          views,
          created_at,
          courses (
            course_code,
            course_title,
            department
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.contentType && filters.contentType !== 'all') {
        query = query.eq('content_type', filters.contentType);
      }

      if (filters.searchQuery?.trim()) {
        query = query.ilike('title', `%${filters.searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped = data.map((t: any) => ({
          ...t,
          course_code: t.courses?.course_code || 'PCH 401',
          course_title: t.courses?.course_title || 'Pharmaceutical Chemistry',
          department: t.courses?.department || 'College of Pharmacy'
        }));
        return { data: mapped as DbTutorial[], fromDatabase: true };
      }
    } catch (err) {
      console.warn('Supabase tutorials fetch error, using local fallback:', err);
    }
  }

  // Graceful fallback with rich sample video & text guides
  let fallback: DbTutorial[] = [
    ...tutorialsData.map(normalizeLocalTutorial),
    {
      id: 'tut-mth101-calc-text',
      course_id: '11111111-1111-1111-1111-111111111101',
      title: 'Limits, Continuity & L\'Hôpital\'s Rule Comprehensive Guide',
      content_type: 'text',
      video_url: null,
      written_content: `# Limits & Continuity Explained\n\n## 1. Formal Definition of a Limit\n\nWe say that $\\lim_{x \\to c} f(x) = L$ if for every $\\epsilon > 0$, there exists a $\\delta > 0$ such that:\n\n$$0 < |x - c| < \\delta \\implies |f(x) - L| < \\epsilon$$\n\n## 2. Standard Evaluation Techniques\n- **Factoring & Cancellation**\n- **Conjugate Rationalization**\n- **L'Hôpital's Rule for $\\frac{0}{0}$ and $\\frac{\\infty}{\\infty}$ Indeterminate Forms**`,
      tutor_name: 'Academic Committee Mathematics Scholar',
      duration: '15 min read',
      views: 3120,
      course_code: 'MTH 101',
      course_title: 'Elementary Mathematics I',
      department: 'Department of Mathematics',
      created_at: new Date().toISOString()
    }
  ];

  if (filters.contentType && filters.contentType !== 'all') {
    fallback = fallback.filter((t) => t.content_type === filters.contentType);
  }

  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.toLowerCase();
    fallback = fallback.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.course_code?.toLowerCase().includes(q) ||
        t.tutor_name?.toLowerCase().includes(q)
    );
  }

  return { data: fallback, fromDatabase: false };
}

/**
 * Fetches a single tutorial by ID
 */
export async function fetchTutorialById(id: string): Promise<DbTutorial | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          id,
          course_id,
          title,
          content_type,
          video_url,
          written_content,
          tutor_name,
          duration,
          views,
          created_at,
          courses (
            course_code,
            course_title,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        const item: any = data;
        return {
          ...item,
          course_code: item.courses?.course_code || 'PCH 401',
          course_title: item.courses?.course_title || 'Pharmaceutical Chemistry',
          department: item.courses?.department || 'College of Pharmacy'
        };
      }
    } catch (err) {
      console.warn('Supabase fetch tutorial by id error:', err);
    }
  }

  const res = await fetchTutorials();
  return res.data.find((t) => t.id === id) || res.data[0] || null;
}
