'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StitchSearchBar from '@/components/search/StitchSearchBar';
import { coursesData } from '@/data/coursesData';
import { Course } from '@/types';
import { searchCourseware, UnifiedSearchRecord } from '@/lib/searchService';
import { isAlgoliaConfigured } from '@/lib/algolia';
import { 
  BookOpen, 
  FileText, 
  Video, 
  ArrowRight, 
  SlidersHorizontal, 
  RotateCcw,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  X,
  Tag,
  Search,
  Filter
} from 'lucide-react';

function CoursesContent() {
  const searchParams = useSearchParams();
  const initialLevel = searchParams.get('level') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSpec, setSelectedSpec] = useState<string>('all');
  const [searchExecutionTime, setSearchExecutionTime] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);

  // Sync with searchParams if url changes
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
    const urlLevel = searchParams.get('level');
    if (urlLevel !== null && urlLevel !== selectedLevel) {
      setSelectedLevel(urlLevel);
    }
  }, [searchParams]);

  // Execute instant client-side search indexing
  const [matchedCourseIds, setMatchedCourseIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let isCurrent = true;
    if (!searchQuery.trim()) {
      setMatchedCourseIds(null);
      setSearchExecutionTime(0);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchCourseware(searchQuery, {
          type: 'course',
          level: selectedLevel !== 'all' ? selectedLevel : undefined,
          semester: selectedSemester !== 'all' ? selectedSemester : undefined,
          department: selectedSpec !== 'all' ? selectedSpec : undefined,
        });

        if (isCurrent) {
          const ids = new Set<string>();
          for (const hit of res.hits) {
            ids.add(hit.objectID.replace('course-', ''));
          }
          setMatchedCourseIds(ids);
          setSearchExecutionTime(res.executionTimeMs);
        }
      } catch (err) {
        console.error('Courses search failed:', err);
      } finally {
        if (isCurrent) setIsSearching(false);
      }
    }, 50);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedLevel, selectedSemester, selectedSpec]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return coursesData.filter((course) => {
      // Level filter
      if (selectedLevel !== 'all' && course.level !== selectedLevel) {
        return false;
      }
      // Semester filter
      if (selectedSemester !== 'all' && course.semester !== selectedSemester) {
        return false;
      }
      // Specialization filter
      if (selectedSpec !== 'all' && course.specialization !== selectedSpec && course.department !== selectedSpec) {
        return false;
      }
      // Search index match
      if (matchedCourseIds !== null) {
        return matchedCourseIds.has(course.id) || matchedCourseIds.has(course.code.toLowerCase().replace(/\s+/g, '-'));
      }
      return true;
    });
  }, [selectedLevel, selectedSemester, selectedSpec, matchedCourseIds]);

  const levelTabs = ['all', '100', '200', '300', '400', '500', '600'];

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedLevel !== 'all') count++;
    if (selectedSemester !== 'all') count++;
    if (selectedSpec !== 'all') count++;
    return count;
  }, [selectedLevel, selectedSemester, selectedSpec]);

  // Lock body scroll when mobile filter sheet is open
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

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedSemester('all');
    setSelectedSpec('all');
  };

  const hasActiveFilters = 
    selectedLevel !== 'all' || 
    selectedSemester !== 'all' || 
    selectedSpec !== 'all' || 
    searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Stats Banner */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
            <div className="max-w-2xl">
              <h1 className="font-['Montserrat',sans-serif] text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Explore Courses
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-2">
                Find course materials organized by level and semester, maintained by PANS course representatives.
              </p>
            </div>

            {/* Academic Snapshot Stats Widget */}
            <div className="flex items-center gap-4 bg-white p-3.5 sm:p-4 rounded-xl shadow-xs border border-slate-200 self-start lg:self-auto">
              <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-[#F3E8FF] flex items-center justify-center text-[#6B21A8]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Montserrat',sans-serif] font-bold text-lg text-[#0F172A] leading-tight">
                    {coursesData.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Courses</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#630ed4]">
                  <GraduationCap className="w-5 h-5 text-[#7c3aed]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Montserrat',sans-serif] font-bold text-lg text-[#0F172A] leading-tight">
                    100L - 600L
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Academic Levels</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search & Filter Action Bar (< lg) */}
          <div className="lg:hidden my-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <StitchSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                  placeholder="Search courses, codes..."
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

            {/* Quick Level Pills Scrollable Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {levelTabs.map((lvl) => {
                const isActive = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                        : 'bg-[#eff4ff] hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8]'
                    }`}
                  >
                    {lvl === 'all' ? 'All Levels' : `${lvl}L`}
                  </button>
                );
              })}
            </div>

            {/* Quick Active Filter Badges on Mobile */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={resetFilters}
                  className="min-h-[40px] px-3 py-1 rounded-lg bg-slate-200/80 text-slate-700 font-semibold whitespace-nowrap shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
                {selectedLevel !== 'all' && (
                  <span className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FAF5FF] text-[#6B21A8] font-medium border border-[#E9D5FF] shrink-0">
                    <span>{selectedLevel}L</span>
                    <button onClick={() => setSelectedLevel('all')} className="p-1 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSemester !== 'all' && (
                  <span className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#eff4ff] text-slate-700 font-medium border border-slate-200 shrink-0">
                    <span>{selectedSemester} Sem</span>
                    <button onClick={() => setSelectedSemester('all')} className="p-1 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSpec !== 'all' && (
                  <span className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#eff4ff] text-slate-700 font-medium border border-slate-200 shrink-0">
                    <span className="truncate max-w-[120px]">{selectedSpec}</span>
                    <button onClick={() => setSelectedSpec('all')} className="p-1 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Filter Bar (hidden on mobile, lg:block - Untouched Desktop Experience) */}
          <div className="hidden lg:block bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 my-8 space-y-5">
            {/* Typing-Responsive Stitch Search Input */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="w-full flex-1">
                <StitchSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                  placeholder="Search courses, codes or topics (e.g. Pharmaceutical Chemistry, PCH 401, Pharmacognosy)..."
                  size="md"
                  showDropdown={false}
                  showKbdHint={true}
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors shrink-0"
                >
                  Clear Search
                </button>
              )}
            </div>

            {/* Level Quick Switcher Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {levelTabs.map((lvl) => {
                const isActive = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#7C3AED] text-white shadow-sm'
                        : 'bg-[#eff4ff] hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8]'
                    }`}
                  >
                    {lvl === 'all' ? 'All Levels' : `${lvl}L`}
                  </button>
                );
              })}
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              {/* Filter 1: Academic Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Academic Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:border-[#7c3aed] transition-colors min-h-[44px]"
                >
                  <option value="all">All Levels (100L - 600L)</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                  <option value="600">600 Level</option>
                </select>
              </div>

              {/* Filter 2: Semester */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:border-[#7c3aed] transition-colors min-h-[44px]"
                >
                  <option value="all">All Semesters</option>
                  <option value="First">First Semester</option>
                  <option value="Second">Second Semester</option>
                </select>
              </div>

              {/* Filter 3: Specialization */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Specialization Discipline
                </label>
                <select
                  value={selectedSpec}
                  onChange={(e) => setSelectedSpec(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:border-[#7c3aed] transition-colors min-h-[44px]"
                >
                  <option value="all">All Disciplines</option>
                  <option value="Pharmaceutical Chemistry">Pharmaceutical Chemistry</option>
                  <option value="Pharmaceutics & Industrial Pharmacy">Pharmaceutics & Tech</option>
                  <option value="Pharmacology & Toxicology">Pharmacology & Therapeutics</option>
                  <option value="Pharmacognosy & Drug Development">Pharmacognosy</option>
                  <option value="Clinical Pharmacy & Pharmacy Practice">Clinical Pharmacy</option>
                  <option value="Basic Sciences & Pre-Pharmacy">Basic Sciences</option>
                </select>
              </div>
            </div>

            {/* Dynamic Active Filter Tags Strip */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Active Filters:
                </span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF5FF] border border-[#E9D5FF] text-xs font-medium text-[#6B21A8]">
                    <span>Query: &ldquo;{searchQuery}&rdquo;</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedLevel !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-medium text-slate-700">
                    <span>Level: {selectedLevel}L</span>
                    <button onClick={() => setSelectedLevel('all')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedSemester !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-medium text-slate-700">
                    <span>Semester: {selectedSemester}</span>
                    <button onClick={() => setSelectedSemester('all')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedSpec !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-medium text-slate-700">
                    <span>Discipline: {selectedSpec}</span>
                    <button onClick={() => setSelectedSpec('all')} className="hover:text-red-600">
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
            aria-label="Filter course library"
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
                  Filter Courses
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

            {/* Scrollable Filter Options */}
            <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
              {/* Academic Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Academic Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="all">All Levels (100L - 600L)</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                  <option value="600">600 Level</option>
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Semester
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'First', 'Second'].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSelectedSemester(sem)}
                      className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                        selectedSemester === sem
                          ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {sem === 'all' ? 'All' : `${sem} Sem`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialization Discipline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Specialization Discipline
                </label>
                <select
                  value={selectedSpec}
                  onChange={(e) => setSelectedSpec(e.target.value)}
                  className="w-full h-11 min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="all">All Disciplines</option>
                  <option value="Pharmaceutical Chemistry">Pharmaceutical Chemistry</option>
                  <option value="Pharmaceutics & Industrial Pharmacy">Pharmaceutics & Tech</option>
                  <option value="Pharmacology & Toxicology">Pharmacology & Therapeutics</option>
                  <option value="Pharmacognosy & Drug Development">Pharmacognosy</option>
                  <option value="Clinical Pharmacy & Pharmacy Practice">Clinical Pharmacy</option>
                  <option value="Basic Sciences & Pre-Pharmacy">Basic Sciences</option>
                </select>
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

          {/* Results Summary & Real-time Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Showing <span className="text-[#630ed4] font-bold">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''}
              </span>
              {searchExecutionTime > 0 && (
                <span className="text-xs text-slate-400 font-mono">
                  ({searchExecutionTime}ms)
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7c3aed] hover:text-[#6B21A8] transition-colors self-start sm:self-auto min-h-[44px] px-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>

          {/* Courses Grid: 1 col on mobile, 2 col on tablet (sm:), 3 col on desktop (lg:) */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-[#C084FC]/70 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-[#7c3aed] text-white text-xs font-bold font-['Montserrat',sans-serif]">
                        {course.code}
                      </span>
                      <span className="text-xs font-semibold text-[#6B21A8] bg-[#F3E8FF] px-2.5 py-0.5 rounded-full border border-[#E9D5FF]">
                        {course.level}L • {course.semester} Semester
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className="font-['Montserrat',sans-serif] text-base font-bold text-[#0F172A] group-hover:text-[#630ed4] transition-colors mb-2 line-clamp-1">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Lecturer & Department */}
                    <div className="space-y-1.5 mb-6 text-xs text-slate-500 bg-[#eff4ff]/40 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium text-slate-700">{course.leadLecturer}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                        <span className="truncate">{course.units} Credit Units • {course.department}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Materials Counters */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {course.pdfCount} Notes
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {course.pqCount} PQs
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Video className="w-3.5 h-3.5 text-slate-400" />
                        {course.tutorialCount} Videos
                      </span>
                    </div>

                    {/* Action Links (44px min-h touch targets) */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/courses/${course.code.toLowerCase().replace(' ', '-')}`}
                        className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl bg-[#eff4ff] hover:bg-[#F3E8FF] text-[#6B21A8] transition-colors"
                      >
                        <span>Syllabus</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href="/viewer"
                        className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl bg-[#7c3aed] hover:bg-[#6B21A8] text-white shadow-xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read PDF</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-[#FAF5FF] flex items-center justify-center text-[#7C3AED] mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-['Montserrat',sans-serif] text-lg font-bold text-[#0F172A] mb-1">
                No courses match your filter criteria
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                Try searching for topics like &ldquo;Pharmacokinetics&rdquo;, &ldquo;PCH 401&rdquo;, or reset your active filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-lg bg-[#7c3aed] text-white text-sm font-semibold hover:bg-[#6B21A8] transition-colors shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">Loading Course Library...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
