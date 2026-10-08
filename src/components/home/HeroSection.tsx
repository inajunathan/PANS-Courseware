'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, PlayCircle, School } from 'lucide-react';
import StitchSearchBar from '@/components/search/StitchSearchBar';

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleSearchSubmit = () => {
    if (query.trim()) {
      router.push(`/courses?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#03152D] py-20 md:py-28 text-white">
      {/* Background Photography with Ambient Navy Overlay & Subtle Scroll Parallax */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${Math.min(scrollY * 0.18, 90)}px) scale(1.05)` }}
      >
        <img
          src="/assets/hero-pharmacy.png"
          alt="Pharmacy students studying in library"
          className="w-full h-full object-cover object-center"
        />
        {/* Deep midnight navy atmospheric gradient */}
        <div className="absolute inset-0 bg-[#03152D]/85 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03152D] via-[#03152D]/50 to-[#03152D]/70" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-[#E9D5FF] mb-6 backdrop-blur-sm shadow-sm">
          <School className="w-4 h-4 text-[#C084FC]" />
          <span className="text-xs uppercase tracking-wider text-white font-semibold">
            Pharmacy Student Repository
          </span>
        </div>

        {/* Main Display Headline */}
        <h1 className="font-['Montserrat',sans-serif] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-5">
          Your Pharmacy School Resources,{' '}
          <span className="text-[#C084FC] drop-shadow-sm">All in One Place.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          Lecture notes, past examination questions, and student-led tutorials structured for every pharmacy level from 100L to 600L at ABUAD.
        </p>

        {/* Main Search Bar with Instant Live Dropdown Preview */}
        <div className="w-full max-w-2xl mx-auto mb-6 relative">
          <StitchSearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearchSubmit}
            placeholder="Search courses, lecture notes (PDFs), past questions, or topics..."
            size="lg"
            showDropdown={true}
            showKbdHint={true}
            className="text-left"
          />
        </div>

        {/* Quick Link Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 mb-12">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 backdrop-blur-sm shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-[#C084FC]" />
            <span>Browse Courses</span>
          </Link>
          <Link
            href="/past-questions"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 backdrop-blur-sm shadow-sm"
          >
            <FileText className="w-4 h-4 text-[#C084FC]" />
            <span>Past Questions Vault</span>
          </Link>
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 backdrop-blur-sm shadow-sm"
          >
            <PlayCircle className="w-4 h-4 text-[#C084FC]" />
            <span>Video Tutorials</span>
          </Link>
        </div>

        {/* Live Academic Statistics Bar */}
        <div className="w-full max-w-4xl border-t border-white/15 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Montserrat',sans-serif] text-white tracking-tight leading-none mb-1">
              600+
            </span>
            <span className="text-xs sm:text-sm text-white/80">Lecture PDFs</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Montserrat',sans-serif] text-white tracking-tight leading-none mb-1">
              12 Yrs
            </span>
            <span className="text-xs sm:text-sm text-white/80">Past Questions</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Montserrat',sans-serif] text-white tracking-tight leading-none mb-1">
              100+
            </span>
            <span className="text-xs sm:text-sm text-white/80">Tutorial Sessions</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Montserrat',sans-serif] text-[#C084FC] tracking-tight leading-none mb-1">
              100L - 600L
            </span>
            <span className="text-xs sm:text-sm text-white/80">All Study Levels</span>
          </div>
        </div>
      </div>
    </section>
  );
}
