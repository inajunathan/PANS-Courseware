'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StitchSearchBar from '@/components/search/StitchSearchBar';
import { fetchPastQuestions, DbPastQuestion } from '@/lib/pastQuestionsService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isAlgoliaConfigured } from '@/lib/algolia';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  RotateCcw, 
  GraduationCap, 
  Calendar, 
  Database, 
  Building, 
  Loader2, 
  ExternalLink,
  Sparkles,
  Filter,
  X
} from 'lucide-react';

function PastQuestionsContent() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams.get('course') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [pastQuestions, setPastQuestions] = useState<DbPastQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDatabase, setFromDatabase] = useState(false);

  const [search, setSearch] = useState(initialSearch);
  const [academicYear, setAcademicYear] = useState<string>('all');
  const [department, setDepartment] = useState<string>('all');
  const [semester, setSemester] = useState<string>('all');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Active filter count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (academicYear !== 'all') count++;
    if (department !== 'all') count++;
    if (semester !== 'all') count++;
    if (onlyVerified) count++;
    return count;
  }, [academicYear, department, semester, onlyVerified]);

  // Lock body scroll when mobile filter bottom sheet is open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  // Fetch past questions dynamically from Supabase or local index
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchPastQuestions({
        courseCode: initialCourse !== 'all' ? initialCourse : undefined,
        academicYear: academicYear !== 'all' ? academicYear : undefined,
        department: department !== 'all' ? department : undefined,
        semester: semester !== 'all' ? semester : undefined,
        onlyVerified: onlyVerified,
        searchQuery: search
      });
      setPastQuestions(res.data);
      setFromDatabase(res.fromDatabase);
      setLoading(false);
    }

    const timer = setTimeout(() => {
      loadData();
    }, 60);

    return () => clearTimeout(timer);
  }, [initialCourse, academicYear, department, semester, onlyVerified, search]);

  const resetFilters = () => {
    setSearch('');
    setAcademicYear('all');
    setDepartment('all');
    setSemester('all');
    setOnlyVerified(false);
  };

  const hasActiveFilters = 
    search.trim().length > 0 ||
    academicYear !== 'all' ||
    department !== 'all' ||
    semester !== 'all' ||
    onlyVerified ||
    initialCourse !== 'all';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="pb-8 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-['Montserrat',sans-serif] text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Past Examination Questions
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl">
                Official past examination papers, continuous assessment tests, and model answers prepared by PANS honor scholars.
              </p>
            </div>
          </div>

          {/* Mobile Search & Filter Action Bar (< lg) */}
          <div className="lg:hidden my-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <StitchSearchBar
                  value={search}
                  onChange={setSearch}
                  onClear={() => setSearch('')}
                  placeholder="Search code, title, session..."
                  size="md"
                  showDropdown={false}
                />
              </div>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F3E8FF] text-[#6B21A8] font-bold text-xs sm:text-sm border border-[#E9D5FF] active:scale-95 transition-all shadow-xs shrink-0"
                aria-label="Open filter options"
              >
                <Filter className="w-4 h-4 text-[#7C3AED]" />
                <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
              </button>
            </div>

            {/* Quick Active Filter Badges on Mobile */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={resetFilters}
                  className="min-h-[44px] px-3 py-1 rounded-lg bg-slate-200/80 text-slate-700 font-semibold whitespace-nowrap shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
                {onlyVerified && (
                  <span className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 shrink-0">
                    <span>With Solutions</span>
                    <button onClick={() => setOnlyVerified(false)} className="p-1 hover:text-emerald-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {academicYear !== 'all' && (
                  <span className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FAF5FF] text-[#6B21A8] font-medium border border-[#E9D5FF] shrink-0">
                    <span>{academicYear}</span>
                    <button onClick={() => setAcademicYear('all')} className="p-1 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {semester !== 'all' && (
                  <span className="min-h-[44px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#eff4ff] text-slate-700 font-medium border border-slate-200 shrink-0">
                    <span>{semester} Sem</span>
                    <button onClick={() => setSemester('all')} className="p-1 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Filter Bar (hidden on mobile, lg:block - Untouched Desktop Experience) */}
          <div className="hidden lg:block bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 my-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="w-full flex-1">
                <StitchSearchBar
                  value={search}
                  onChange={setSearch}
                  onClear={() => setSearch('')}
                  placeholder="Search by course code, title, academic year, or department (e.g. PCH 401, 2024/2025)..."
                  size="md"
                  showDropdown={false}
                  showKbdHint={true}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors select-none min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4 cursor-pointer"
                  />
                  <span>With Solutions</span>
                </label>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              {/* Academic Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:border-[#7c3aed] transition-colors min-h-[44px]"
                >
                  <option value="all">All Academic Years</option>
                  <option value="2024/2025">2024/2025 Session</option>
                  <option value="2023/2024">2023/2024 Session</option>
                  <option value="2022/2023">2022/2023 Session</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:border-[#7c3aed] transition-colors min-h-[44px]"
                >
                  <option value="all">All Departments</option>
                  <option value="Pharmaceutical Chemistry">Pharmaceutical Chemistry</option>
                  <option value="Pharmaceutics">Pharmaceutics &amp; Tech</option>
                  <option value="Pharmacology">Pharmacology &amp; Therapeutics</option>
                  <option value="Pharmacognosy">Pharmacognosy</option>
                  <option value="Clinical Pharmacy">Clinical Pharmacy</option>
                  <option value="Chemistry">General Chemistry</option>
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:border-[#7c3aed] transition-colors min-h-[44px]"
                >
                  <option value="all">All Semesters</option>
                  <option value="First">First Semester</option>
                  <option value="Second">Second Semester</option>
                </select>
              </div>

              {/* Reset */}
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>

            {/* Dynamic Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Active Filters:
                </span>

                {search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF5FF] border border-[#E9D5FF] text-xs font-medium text-[#6B21A8]">
                    <span>Search: &ldquo;{search}&rdquo;</span>
                    <button onClick={() => setSearch('')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {academicYear !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-medium text-slate-700">
                    <span>Year: {academicYear}</span>
                    <button onClick={() => setAcademicYear('all')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {department !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-medium text-slate-700">
                    <span>Dept: {department}</span>
                    <button onClick={() => setDepartment('all')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {semester !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-medium text-slate-700">
                    <span>Semester: {semester}</span>
                    <button onClick={() => setSemester('all')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {onlyVerified && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                    <span>With Solutions</span>
                    <button onClick={() => setOnlyVerified(false)} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="text-xs text-[#7c3aed] hover:text-[#6B21A8] font-semibold underline underline-offset-2 ml-2 transition-colors min-h-[44px] flex items-center"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Mobile Filter Bottom Sheet Backdrop */}
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300 ${
              mobileFiltersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden="true"
          />

          {/* Mobile Filter Bottom Sheet (Slide-up modal from bottom) */}
          <aside
            className={`fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-3xl z-50 lg:hidden shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
              mobileFiltersOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
            aria-label="Filter past questions"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-300"></div>
            </div>

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] flex items-center justify-center text-[#7C3AED]">
                  <Filter className="w-4 h-4" />
                </div>
                <h2 className="font-['Montserrat',sans-serif] font-bold text-base text-[#0F172A]">
                  Filter Archive
                </h2>
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Options in Sheet */}
            <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
              {/* With Solutions Toggle */}
              <label className="min-h-[44px] flex items-center justify-between p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] cursor-pointer">
                <span className="text-sm font-semibold text-[#6B21A8]">Show Only Papers with Solutions</span>
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-5 h-5 cursor-pointer"
                />
              </label>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="all">All Academic Years</option>
                  <option value="2024/2025">2024/2025 Session</option>
                  <option value="2023/2024">2023/2024 Session</option>
                  <option value="2022/2023">2022/2023 Session</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="all">All Departments</option>
                  <option value="Pharmaceutical Chemistry">Pharmaceutical Chemistry</option>
                  <option value="Pharmaceutics">Pharmaceutics &amp; Tech</option>
                  <option value="Pharmacology">Pharmacology &amp; Therapeutics</option>
                  <option value="Pharmacognosy">Pharmacognosy</option>
                  <option value="Clinical Pharmacy">Clinical Pharmacy</option>
                  <option value="Chemistry">General Chemistry</option>
                </select>
              </div>

              {/* Semester (Segmented buttons) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Semester
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'First', 'Second'].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSemester(sem)}
                      className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                        semester === sem
                          ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {sem === 'all' ? 'All' : `${sem} Sem`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors text-center"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6B21A8] text-white text-sm font-bold shadow-md transition-colors text-center"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Results Count & State */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-semibold text-slate-700">
              Found <strong className="text-[#630ed4]">{pastQuestions.length}</strong> past question{pastQuestions.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7c3aed] hover:text-[#6B21A8] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED] mb-3" />
              <p className="text-slate-600 text-sm font-medium">Fetching past questions...</p>
            </div>
          ) : pastQuestions.length > 0 ? (
            /* Responsive Grid: 1 col on mobile, 2 col on tablet (sm:), 3 col on desktop (lg:) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {pastQuestions.map((pq) => (
                <div
                  key={pq.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#C084FC]/70 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-[#7c3aed] text-white text-xs font-bold font-['Montserrat',sans-serif]">
                        {pq.course_code}
                      </span>
                      <span className="text-xs font-bold text-[#6B21A8] bg-[#F3E8FF] px-2.5 py-0.5 rounded-full border border-[#E9D5FF]">
                        {pq.academic_year}
                      </span>
                    </div>

                    <h3 className="font-['Montserrat',sans-serif] text-base font-bold text-[#0F172A] mb-1 line-clamp-1 group-hover:text-[#630ed4] transition-colors">
                      {pq.course_title}
                    </h3>

                    <p className="text-xs font-semibold text-slate-700 mb-3">
                      {pq.exam_type || 'Examination Paper'}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-500 mb-6 bg-[#eff4ff]/40 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                        <span className="truncate">{pq.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pq.total_pages || 8} Pages • {pq.file_size || '2.4 MB'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (44px min-h Touch Targets) */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <Link
                      href={`/past-questions/${pq.id}`}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl bg-[#7c3aed] hover:bg-[#6B21A8] text-white shadow-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Link>

                    <a
                      href={pq.pdf_storage_url || '/sample-past-question.pdf'}
                      download={`${pq.course_code}_${pq.academic_year.replace('/', '_')}.pdf`}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl bg-[#eff4ff] hover:bg-[#F3E8FF] text-[#6B21A8] transition-colors border border-[#E9D5FF]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <p className="text-slate-600 text-base font-semibold mb-3">
                No past questions found matching your filter criteria.
              </p>
              <button
                onClick={resetFilters}
                className="min-h-[44px] px-5 py-2.5 bg-[#7C3AED] text-white text-xs font-semibold rounded-xl hover:bg-[#6B21A8] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PastQuestionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">Loading Past Questions Vault...</div>}>
      <PastQuestionsContent />
    </Suspense>
  );
}
