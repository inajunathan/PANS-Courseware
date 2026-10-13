import { coursesData } from '@/data/coursesData';
import { pastQuestionsData } from '@/data/pastQuestionsData';
import { tutorialsData } from '@/data/tutorialsData';
import { Course } from '@/types';
import { algoliaClient, ALGOLIA_INDEX_NAME, isAlgoliaConfigured } from './algolia';

export type SearchRecordType = 'course' | 'past_question' | 'tutorial';

export interface UnifiedSearchRecord {
  objectID: string;
  type: SearchRecordType;
  title: string;
  code: string;
  subtitle: string;
  description: string;
  level: string; // e.g. '100', '200', '300', '400', '500', '600'
  semester?: string; // 'First' | 'Second'
  department: string;
  academicYear?: string;
  specialization?: string;
  url: string;
  badge: string;
  badgeColor: 'purple' | 'blue' | 'emerald' | 'amber';
  metadata: {
    units?: number;
    pdfCount?: number;
    pqCount?: number;
    tutorialCount?: number;
    hasVerifiedSolutions?: boolean;
    duration?: string;
    views?: number;
    tutor?: string;
    fileSize?: string;
    totalPages?: number;
  };
  keywords: string[];
}

export interface SearchFilters {
  type?: SearchRecordType | 'all';
  level?: string; // 'all' or '100'-'600'
  semester?: string; // 'all' or 'First' | 'Second'
  department?: string; // 'all' or specific name
  academicYear?: string; // 'all' or specific
  onlyVerified?: boolean;
}

export interface SearchFacetCounts {
  all: number;
  courses: number;
  pastQuestions: number;
  tutorials: number;
}

export interface SearchResponse {
  hits: UnifiedSearchRecord[];
  totalHits: number;
  facets: SearchFacetCounts;
  source: 'algolia' | 'in_memory';
  executionTimeMs: number;
}

/**
 * Builds the comprehensive in-memory search index from local datasets.
 */
function buildLocalSearchIndex(): UnifiedSearchRecord[] {
  const records: UnifiedSearchRecord[] = [];

  // 1. Index Courses
  for (const c of coursesData) {
    const lectureKeywords = c.lectureUnits.map((u) => u.title).join(' ');
    records.push({
      objectID: `course-${c.id}`,
      type: 'course',
      title: c.title,
      code: c.code,
      subtitle: `${c.code} • ${c.level}L • ${c.semester} Semester • ${c.units} Units`,
      description: c.description,
      level: c.level,
      semester: c.semester,
      department: c.department,
      specialization: c.specialization,
      url: `/courses/${c.id}`,
      badge: `${c.level}L • ${c.units} Units`,
      badgeColor: 'purple',
      metadata: {
        units: c.units,
        pdfCount: c.pdfCount,
        pqCount: c.pqCount,
        tutorialCount: c.tutorialCount,
      },
      keywords: [
        c.code.toLowerCase(),
        c.code.toLowerCase().replace(/\s+/g, ''),
        c.title.toLowerCase(),
        c.department.toLowerCase(),
        c.specialization.toLowerCase(),
        c.leadLecturer.toLowerCase(),
        lectureKeywords.toLowerCase(),
        `${c.level}l`,
        `${c.level} level`,
      ],
    });
  }

  // 2. Index Past Questions
  for (const pq of pastQuestionsData) {
    records.push({
      objectID: `pq-${pq.id}`,
      type: 'past_question',
      title: `${pq.courseCode} ${pq.examType}`,
      code: pq.courseCode,
      subtitle: `${pq.courseTitle} • ${pq.session}`,
      description: `Official past examination paper by ${pq.examiners}. Includes ${pq.totalPages} pages (${pq.fileSize}).`,
      level: pq.level,
      semester: pq.semester,
      department: 'College of Pharmacy',
      academicYear: pq.session.replace(' Session', '').trim(),
      url: `/past-questions/${pq.id}`,
      badge: `${pq.level}L Exam Paper`,
      badgeColor: 'blue',
      metadata: {
        hasVerifiedSolutions: pq.hasVerifiedSolutions,
        fileSize: pq.fileSize,
        totalPages: pq.totalPages,
      },
      keywords: [
        pq.courseCode.toLowerCase(),
        pq.courseCode.toLowerCase().replace(/\s+/g, ''),
        pq.courseTitle.toLowerCase(),
        pq.session.toLowerCase(),
        pq.examType.toLowerCase(),
        pq.examiners.toLowerCase(),
        `${pq.level}l`,
        'past question',
        'past question paper',
        'exam',
      ],
    });
  }

  // 3. Index Tutorials
  for (const tut of tutorialsData) {
    records.push({
      objectID: `tut-${tut.id}`,
      type: 'tutorial',
      title: tut.title,
      code: tut.courseCode,
      subtitle: `${tut.courseCode} • ${tut.category} • ${tut.tutor}`,
      description: `Comprehensive video tutorial and revision guide presented by ${tut.tutor} (${tut.tutorRole}). Duration: ${tut.duration}.`,
      level: tut.level,
      department: tut.category,
      specialization: tut.category,
      url: `/tutorials`,
      badge: tut.duration,
      badgeColor: 'amber',
      metadata: {
        duration: tut.duration,
        views: tut.views,
        tutor: tut.tutor,
      },
      keywords: [
        tut.title.toLowerCase(),
        tut.courseCode.toLowerCase(),
        tut.courseCode.toLowerCase().replace(/\s+/g, ''),
        tut.category.toLowerCase(),
        tut.tutor.toLowerCase(),
        `${tut.level}l`,
        'tutorial',
        'video lecture',
        'masterclass',
      ],
    });
  }

  return records;
}

// Global cached in-memory index
let cachedIndex: UnifiedSearchRecord[] | null = null;

export function getLocalSearchIndex(): UnifiedSearchRecord[] {
  if (!cachedIndex) {
    cachedIndex = buildLocalSearchIndex();
  }
  return cachedIndex;
}

/**
 * Dynamically enriches the in-memory search index with live courses retrieved from Supabase
 */
export function updateSearchIndexWithCourses(liveCourses: Course[]): void {
  if (!liveCourses || liveCourses.length === 0) return;
  const current = getLocalSearchIndex();
  const otherRecords = current.filter((r) => r.type !== 'course');

  const newCourseRecords: UnifiedSearchRecord[] = [];
  for (const c of liveCourses) {
    const lectureKeywords = (c.lectureUnits || []).map((u) => u.title).join(' ');
    newCourseRecords.push({
      objectID: `course-${c.id}`,
      type: 'course',
      title: c.title,
      code: c.code,
      subtitle: `${c.code} • ${c.level}L • ${c.semester} Semester • ${c.units} Units`,
      description: c.description,
      level: c.level,
      semester: c.semester,
      department: c.department,
      specialization: c.specialization,
      url: `/courses/${c.code.toLowerCase().replace(/\s+/g, '-')}`,
      badge: `${c.level}L • ${c.units} Units`,
      badgeColor: 'purple',
      metadata: {
        units: c.units,
        pdfCount: c.pdfCount,
        pqCount: c.pqCount,
        tutorialCount: c.tutorialCount,
      },
      keywords: [
        c.code.toLowerCase(),
        c.code.toLowerCase().replace(/\s+/g, ''),
        c.title.toLowerCase(),
        c.department.toLowerCase(),
        c.specialization?.toLowerCase() || '',
        c.leadLecturer?.toLowerCase() || '',
        lectureKeywords.toLowerCase(),
        `${c.level}l`,
        `${c.level} level`,
      ],
    });
  }

  cachedIndex = [...newCourseRecords, ...otherRecords];
}

/**
 * Normalizes query string for flexible matching
 */
function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Calculates a match score for an item given search tokens
 */
function scoreItem(record: UnifiedSearchRecord, rawQuery: string, tokens: string[]): number {
  if (tokens.length === 0) return 1;

  const cleanQuery = rawQuery.toLowerCase().trim();
  const rawCode = record.code.toLowerCase().replace(/\s+/g, '');
  const queryNoSpace = cleanQuery.replace(/\s+/g, '');

  let score = 0;

  // Direct exact code match (e.g. 'PCH 401' or 'pch401')
  if (record.code.toLowerCase() === cleanQuery || rawCode === queryNoSpace) {
    score += 150;
  } else if (rawCode.includes(queryNoSpace) || cleanQuery.includes(rawCode)) {
    score += 80;
  }

  // Exact title match or starts with
  if (record.title.toLowerCase().startsWith(cleanQuery)) {
    score += 70;
  } else if (record.title.toLowerCase().includes(cleanQuery)) {
    score += 40;
  }

  // Token-by-token scoring
  let matchedTokens = 0;
  for (const token of tokens) {
    let tokenScore = 0;

    // Check code
    if (record.code.toLowerCase().includes(token) || rawCode.includes(token)) {
      tokenScore = Math.max(tokenScore, 30);
    }

    // Check title
    if (record.title.toLowerCase().includes(token)) {
      tokenScore = Math.max(tokenScore, 25);
    }

    // Check subtitle/department/specialization
    if (
      record.subtitle.toLowerCase().includes(token) ||
      record.department.toLowerCase().includes(token) ||
      (record.specialization && record.specialization.toLowerCase().includes(token))
    ) {
      tokenScore = Math.max(tokenScore, 15);
    }

    // Check description or keywords
    if (record.description.toLowerCase().includes(token)) {
      tokenScore = Math.max(tokenScore, 10);
    }

    if (record.keywords.some((kw) => kw.includes(token))) {
      tokenScore = Math.max(tokenScore, 12);
    }

    if (tokenScore > 0) {
      score += tokenScore;
      matchedTokens++;
    }
  }

  // Penalize records that don't match all tokens
  if (matchedTokens < tokens.length) {
    score = score * (matchedTokens / tokens.length) * 0.4;
  }

  return score;
}

/**
 * Unified Instant Search Function
 * Executes against Algolia if configured, or uses the instant in-memory index engine.
 */
export async function searchCourseware(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const startTime = performance.now();
  const allRecords = getLocalSearchIndex();

  // Try Algolia search if configured
  if (isAlgoliaConfigured && algoliaClient) {
    try {
      const response = await algoliaClient.search({
        requests: [
          {
            indexName: ALGOLIA_INDEX_NAME,
            query: query.trim(),
            hitsPerPage: 50,
          },
        ],
      });

      const firstResult = response.results[0];
      if (firstResult && 'hits' in firstResult && Array.isArray(firstResult.hits) && firstResult.hits.length > 0) {
        // Map Algolia hits
        const algoliaHits: UnifiedSearchRecord[] = (firstResult.hits as any[]).map((hit) => {
          return {
            objectID: hit.objectID || hit.id,
            type: hit.type || 'course',
            title: hit.title || hit.course_title || hit.code,
            code: hit.code || hit.course_code || '',
            subtitle: hit.subtitle || '',
            description: hit.description || '',
            level: String(hit.level || '400'),
            semester: hit.semester,
            department: hit.department || '',
            academicYear: hit.academicYear || hit.academic_year,
            specialization: hit.specialization,
            url: hit.url || `/courses/${hit.code?.toLowerCase().replace(/\s+/g, '-')}`,
            badge: hit.badge || `${hit.level}L`,
            badgeColor: hit.badgeColor || 'purple',
            metadata: hit.metadata || {},
            keywords: hit.keywords || [],
          };
        });

        // Filter and calculate facets
        return processFilteredHits(algoliaHits, query, filters, 'algolia', startTime);
      }
    } catch (err) {
      console.warn('Algolia search failed, using instant client-side index fallback:', err);
    }
  }

  // Instant Client-Side In-Memory Engine Fallback
  return processFilteredHits(allRecords, query, filters, 'in_memory', startTime);
}

function processFilteredHits(
  records: UnifiedSearchRecord[],
  query: string,
  filters: SearchFilters,
  source: 'algolia' | 'in_memory',
  startTime: number
): SearchResponse {
  const tokens = normalizeQuery(query);
  const isQueryEmpty = tokens.length === 0;

  // 1. Calculate overall Facet Counts before type/level/semester filters
  let countCourses = 0;
  let countPastQuestions = 0;
  let countTutorials = 0;

  const scoredRecords: Array<{ record: UnifiedSearchRecord; score: number }> = [];

  for (const record of records) {
    const score = isQueryEmpty ? 1 : scoreItem(record, query, tokens);
    if (score > 0) {
      if (record.type === 'course') countCourses++;
      if (record.type === 'past_question') countPastQuestions++;
      if (record.type === 'tutorial') countTutorials++;

      scoredRecords.push({ record, score });
    }
  }

  // 2. Apply user-selected filters
  const filtered = scoredRecords.filter(({ record }) => {
    // Type filter
    if (filters.type && filters.type !== 'all' && record.type !== filters.type) {
      return false;
    }

    // Level filter
    if (filters.level && filters.level !== 'all' && record.level !== filters.level) {
      return false;
    }

    // Semester filter
    if (filters.semester && filters.semester !== 'all' && record.semester && record.semester !== filters.semester) {
      return false;
    }

    // Department filter
    if (filters.department && filters.department !== 'all' && record.department !== filters.department) {
      return false;
    }

    // Academic Year filter
    if (filters.academicYear && filters.academicYear !== 'all' && record.academicYear !== filters.academicYear) {
      return false;
    }

    // Only Verified filter
    if (filters.onlyVerified && !record.metadata.hasVerifiedSolutions) {
      return false;
    }

    return true;
  });

  // 3. Sort by score descending (or keep original catalog ordering if no query)
  if (!isQueryEmpty) {
    filtered.sort((a, b) => b.score - a.score);
  }

  const hits = filtered.map((f) => f.record);
  const endTime = performance.now();

  return {
    hits,
    totalHits: hits.length,
    facets: {
      all: countCourses + countPastQuestions + countTutorials,
      courses: countCourses,
      pastQuestions: countPastQuestions,
      tutorials: countTutorials,
    },
    source,
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
  };
}
