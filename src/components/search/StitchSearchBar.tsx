'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  BookOpen, 
  FileText, 
  Video, 
  ArrowRight, 
  Sparkles,
  Command,
  Loader2
} from 'lucide-react';
import { searchCourseware, UnifiedSearchRecord } from '@/lib/searchService';
import { isAlgoliaConfigured } from '@/lib/algolia';

interface StitchSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  showKbdHint?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function StitchSearchBar({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = 'Search courses, past questions, lecture notes or topics...',
  size = 'md',
  showDropdown = false,
  showKbdHint = true,
  autoFocus = false,
  className = '',
}: StitchSearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [liveHits, setLiveHits] = useState<UnifiedSearchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTime, setSearchTime] = useState<number>(0);

  // Perform live preview search when showDropdown is enabled
  useEffect(() => {
    if (!showDropdown || !value.trim()) {
      setLiveHits([]);
      setDropdownOpen(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchCourseware(value, {});
        if (isMounted) {
          setLiveHits(res.hits.slice(0, 6));
          setSearchTime(res.executionTimeMs);
          setDropdownOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 60);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [value, showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDropdownOpen(false);
    if (onSubmit) {
      onSubmit(e);
    } else if (value.trim()) {
      router.push(`/courses?search=${encodeURIComponent(value.trim())}`);
    }
  };

  // Size styling tokens based on Google Stitch specs
  const sizeClasses = {
    sm: 'py-2 pl-9 pr-9 text-xs',
    md: 'py-3 pl-11 pr-12 text-sm sm:text-base',
    lg: 'py-3.5 sm:py-4 pl-12 sm:pl-14 pr-14 text-base sm:text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4 left-3',
    md: 'w-5 h-5 left-3.5 sm:left-4',
    lg: 'w-5 h-5 sm:w-6 sm:h-6 left-4 sm:left-5',
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4 text-[#7C3AED]" />;
      case 'past_question':
        return <FileText className="w-4 h-4 text-[#126F9A]" />;
      case 'tutorial':
        return <Video className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-500" />;
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
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleFormSubmit} className="relative w-full">
        {/* Search Icon */}
        <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors ${iconSizes[size]}`}>
          {isLoading ? (
            <Loader2 className="w-full h-full animate-spin text-[#7c3aed]" />
          ) : (
            <Search className="w-full h-full" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (showDropdown && value.trim() && liveHits.length > 0) {
              setDropdownOpen(true);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-white border border-slate-200 rounded-xl font-normal text-[#0b1c30] placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#E9D5FF] transition-all duration-200 ${sizeClasses[size]}`}
        />

        {/* Action Controls: Clear Button or Keyboard Hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : showKbdHint ? (
            <div className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 shadow-2xs text-[11px] font-medium text-slate-400 pointer-events-none select-none">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          ) : null}
        </div>
      </form>

      {/* Live Search Instant Dropdown Preview */}
      {showDropdown && dropdownOpen && liveHits.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8f9ff] border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Search className="w-3.5 h-3.5 text-[#7c3aed]" />
              <span>Matching Results</span>
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {liveHits.map((hit) => (
              <Link
                key={hit.objectID}
                href={hit.url}
                onClick={() => setDropdownOpen(false)}
                className="flex items-start gap-3 p-3.5 hover:bg-[#FAF5FF] transition-colors group"
              >
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:border-[#E9D5FF] group-hover:bg-white transition-colors shrink-0 mt-0.5">
                  {getTypeIcon(hit.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#0F172A] group-hover:text-[#6B21A8] transition-colors truncate">
                      {hit.title}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(hit.badgeColor)}`}>
                      {hit.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {hit.subtitle}
                  </p>
                </div>

                <div className="self-center pl-2 text-slate-300 group-hover:text-[#7C3AED] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-[#f8f9ff] border-t border-slate-100 text-center">
            <button
              onClick={handleFormSubmit}
              className="text-xs font-semibold text-[#6B21A8] hover:text-[#7C3AED] transition-colors inline-flex items-center gap-1"
            >
              <span>View all matching results for &ldquo;{value}&rdquo;</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
