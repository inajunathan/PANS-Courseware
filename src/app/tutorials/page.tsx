'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StitchSearchBar from '@/components/search/StitchSearchBar';
import { fetchTutorials, DbTutorial } from '@/lib/tutorialsService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isAlgoliaConfigured } from '@/lib/algolia';
import { 
  Play, 
  Clock, 
  Eye, 
  Video, 
  UserCheck, 
  BookOpen, 
  X, 
  FileText, 
  Database, 
  Building, 
  GraduationCap, 
  Sparkles, 
  Search,
  Filter,
  RotateCcw
} from 'lucide-react';

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<DbTutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDatabase, setFromDatabase] = useState(false);

  const [contentType, setContentType] = useState<'all' | 'video' | 'text'>('all');
  const [search, setSearch] = useState('');
  const [activeVideo, setActiveVideo] = useState<DbTutorial | null>(null);
  const [activeGuide, setActiveGuide] = useState<DbTutorial | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchTutorials({
        contentType: contentType,
        searchQuery: search
      });
      setTutorials(res.data);
      setFromDatabase(res.fromDatabase);
      setLoading(false);
    }

    const timer = setTimeout(() => {
      loadData();
    }, 60);

    return () => clearTimeout(timer);
  }, [contentType, search]);

  const resetFilters = () => {
    setSearch('');
    setContentType('all');
  };

  const hasActiveFilters = search.trim().length > 0 || contentType !== 'all';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="pb-8 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-['Montserrat',sans-serif] text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Academic Tutorials
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl">
                Review course concepts, reaction mechanisms, and pharmacokinetics calculations with peer tutors.
              </p>
            </div>
          </div>

          {/* Search & Content Type Filter Bar (Stitch UI input styling) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 my-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Typing-Responsive Stitch Search Input */}
              <div className="w-full sm:max-w-md">
                <StitchSearchBar
                  value={search}
                  onChange={setSearch}
                  onClear={() => setSearch('')}
                  placeholder="Search topics, courses, or tutor names..."
                  size="md"
                  showDropdown={false}
                  showKbdHint={true}
                />
              </div>

              {/* Content Type Filter Pills */}
              <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setContentType('all')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    contentType === 'all'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8]'
                  }`}
                >
                  All Resources
                </button>
                <button
                  onClick={() => setContentType('video')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    contentType === 'video'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8]'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Tutorials</span>
                </button>
                <button
                  onClick={() => setContentType('text')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    contentType === 'text'
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Written Guides</span>
                </button>
              </div>
            </div>

            {/* Dynamic Active Filter Tags Strip */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Active Filters:
                </span>

                {search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF5FF] border border-[#E9D5FF] text-xs font-medium text-[#6B21A8]">
                    <span>Topic: &ldquo;{search}&rdquo;</span>
                    <button onClick={() => setSearch('')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {contentType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] border border-slate-200 text-xs font-medium text-slate-700">
                    <span>Format: {contentType === 'video' ? 'Video Masterclasses' : 'Written Guides'}</span>
                    <button onClick={() => setContentType('all')} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="text-xs text-[#7c3aed] hover:text-[#6B21A8] font-semibold underline underline-offset-2 ml-2 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-semibold text-slate-700">
              Found <strong className="text-[#630ed4]">{tutorials.length}</strong> tutorial{tutorials.length !== 1 ? 's' : ''}
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

          {/* Tutorials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#C084FC]/70 transition-all flex flex-col justify-between group"
              >
                {/* Header Graphic / Thumbnail */}
                {item.content_type === 'video' ? (
                  <div
                    onClick={() => setActiveVideo(item)}
                    className="relative aspect-video w-full bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={
                        item.id.includes('pch401')
                          ? 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
                          : item.id.includes('pct401')
                          ? 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#7C3AED]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#6B21A8] transition-all">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-[11px] font-semibold text-white">
                      {item.duration || '45:00'}
                    </div>

                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#03152D]/80 backdrop-blur-xs text-[10px] font-bold text-[#E9D5FF] uppercase tracking-wider">
                      {item.course_code || 'PCH 401'}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setActiveGuide(item)}
                    className="p-6 bg-gradient-to-br from-[#eff4ff] to-[#F3E8FF] border-b border-slate-100 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold uppercase tracking-wider">
                        Study Guide
                      </span>
                      <span className="text-xs font-semibold text-[#6B21A8] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.duration || '15 min read'}
                      </span>
                    </div>
                    <BookOpen className="w-8 h-8 text-[#7C3AED]" />
                  </div>
                )}

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => (item.content_type === 'video' ? setActiveVideo(item) : setActiveGuide(item))}
                      className="font-['Montserrat',sans-serif] font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#630ed4] transition-colors cursor-pointer line-clamp-2 mb-2"
                    >
                      {item.title}
                    </h3>

                    <div className="space-y-1 mb-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span className="truncate">{item.tutor_name || 'Academic Committee Lead'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item.course_title || 'Pharmaceutical Chemistry'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {(item.views || 1200).toLocaleString()} views
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tutorials/${item.id}`}
                        className="text-xs font-semibold text-slate-500 hover:text-[#630ed4] transition-colors"
                        title="Open Dedicated Page"
                      >
                        Open Page
                      </Link>
                      <button
                        onClick={() => (item.content_type === 'video' ? setActiveVideo(item) : setActiveGuide(item))}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6B21A8]"
                      >
                        <span>{item.content_type === 'video' ? 'Watch' : 'Read'}</span>
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tutorials.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 mt-6">
              <p className="text-slate-600 text-base font-semibold mb-2">
                No tutorial resources found matching your search.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-semibold rounded-lg hover:bg-[#6B21A8]"
              >
                Reset Search
              </button>
            </div>
          )}

          {/* Video Modal Player */}
          {activeVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-slate-900 flex items-center justify-between text-white">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">{activeVideo.title}</h3>
                    <p className="text-xs text-slate-400">{activeVideo.tutor_name}</p>
                  </div>
                  <button
                    onClick={() => setActiveVideo(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Guide Modal Reader */}
          {activeGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
                <div className="p-4 sm:p-6 bg-[#03152D] text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#C084FC] font-bold">
                      {activeGuide.course_code} Study Guide
                    </span>
                    <h3 className="font-['Montserrat',sans-serif] font-bold text-base sm:text-lg text-white">
                      {activeGuide.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveGuide(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-slate-800 text-sm leading-relaxed">
                  <div className="p-4 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] text-xs text-[#6B21A8]">
                    <strong>Tutor:</strong> {activeGuide.tutor_name} • <strong>Format:</strong> High-yield examination prep notes
                  </div>

                  <p>
                    {activeGuide.written_content || (
                      <>
                        Structure-Activity Relationships (SAR) explore the relationship between the chemical structure
                        of a molecule and its biological activity. Modification of functional groups alters receptor affinity,
                        pharmacokinetics, and metabolic stability.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
