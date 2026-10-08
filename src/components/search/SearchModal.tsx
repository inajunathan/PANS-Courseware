'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  BookOpen, 
  FileText, 
  Video, 
  ArrowRight, 
  Command, 
  Sparkles, 
  Database,
  CornerDownLeft,
  GraduationCap
} from 'lucide-react';
import { searchCourseware, UnifiedSearchRecord, SearchResponse, SearchRecordType } from '@/lib/searchService';
import { isAlgoliaConfigured } from '@/lib/algolia';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function SearchModal({
  isOpen,
  onClose,
  initialQuery = '',
}: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<SearchRecordType | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync initial query
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      // Autofocus input after modal mount animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Execute instant search
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchCourseware(query, {
          type: selectedType !== 'all' ? selectedType : undefined,
          level: selectedLevel !== 'all' ? selectedLevel : undefined,
        });

        if (isCurrent) {
          setResults(res);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Instant search failed:', err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, 40);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [isOpen, query, selectedType, selectedLevel]);

  // Handle keyboard navigation inside the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      const hits = results?.hits || [];
      if (hits.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % hits.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + hits.length) % hits.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = hits[selectedIndex];
        if (selected) {
          onClose();
          router.push(selected.url);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, router]);

  if (!isOpen) return null;

  const hits = results?.hits || [];
  const facets = results?.facets || { all: 0, courses: 0, pastQuestions: 0, tutorials: 0 };

  const quickSuggestions = [
    { label: 'PCH 401: SAR', query: 'PCH 401' },
    { label: 'Pharmacology 400L', query: 'PCO 401' },
    { label: '2024 Past Questions', query: '2024' },
    { label: 'Pharmacokinetics IV Bolus', query: 'Pharmacokinetics' },
    { label: 'Pharmacognosy', query: 'Pharmacognosy' },
  ];

  const levels = ['all', '100', '200', '300', '400', '500', '600'];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4 text-[#7C3AED]" />;
      case 'past_question':
        return <FileText className="w-4 h-4 text-[#126F9A]" />;
      case 'tutorial':
        return <Video className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 sm:px-6 bg-[#03152D]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 sm:px-6 py-4 border-b border-slate-200 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, past papers, lecture units or topics..."
            className="w-full text-base sm:text-lg text-[#0F172A] placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Filter Toolbar: Categories & Levels */}
        <div className="px-4 sm:px-6 py-3 bg-[#f8f9ff] border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === 'all'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-slate-600 hover:text-[#6B21A8] border border-slate-200'
              }`}
            >
              All ({facets.all})
            </button>
            <button
              onClick={() => setSelectedType('course')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedType === 'course'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-slate-600 hover:text-[#6B21A8] border border-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Courses ({facets.courses})</span>
            </button>
            <button
              onClick={() => setSelectedType('past_question')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedType === 'past_question'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-slate-600 hover:text-[#6B21A8] border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Past Questions ({facets.pastQuestions})</span>
            </button>
            <button
              onClick={() => setSelectedType('tutorial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedType === 'tutorial'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white hover:bg-purple-50 text-slate-600 hover:text-[#6B21A8] border border-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Tutorials ({facets.tutorials})</span>
            </button>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedLevel === lvl
                    ? 'bg-[#03152D] text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {lvl === 'all' ? 'All' : `${lvl}L`}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Suggestion Chips (when search is empty) */}
        {!query && (
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Suggested:</span>
            {quickSuggestions.map((item) => (
              <button
                key={item.label}
                onClick={() => setQuery(item.query)}
                className="px-2.5 py-1 rounded-lg bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#E9D5FF] text-[11px] font-semibold text-[#6B21A8] whitespace-nowrap transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
          {hits.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">No results matching &ldquo;{query}&rdquo;</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching for course codes like PCH 401, topics like Pharmacokinetics, or reset the level filters.
              </p>
            </div>
          ) : (
            hits.map((hit, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <Link
                  key={hit.objectID}
                  href={hit.url}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl transition-all duration-150 group ${
                    isSelected ? 'bg-[#F3E8FF]/70 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                    isSelected ? 'bg-white border-[#C084FC] shadow-2xs' : 'bg-[#f8f9ff] border-slate-200'
                  }`}>
                    {getTypeIcon(hit.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-semibold text-sm sm:text-base leading-snug transition-colors ${
                        isSelected ? 'text-[#6B21A8]' : 'text-[#0F172A]'
                      }`}>
                        {hit.title}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(hit.badgeColor)}`}>
                        {hit.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 mb-1 font-medium">
                      {hit.subtitle}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {hit.description}
                    </p>
                  </div>

                  <div className="self-center pl-2 shrink-0">
                    {isSelected ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#7C3AED] text-white text-[11px] font-medium shadow-xs">
                        <span>Open</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#f8f9ff] border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>{hits.length} result{hits.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">↵</kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">esc</kbd>
              <span>close</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
