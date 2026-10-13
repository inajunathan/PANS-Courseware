'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, PlayCircle, School } from 'lucide-react';
import StitchSearchBar from '@/components/search/StitchSearchBar';

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);

  // Synchronized count-up micro-interactions for academic statistics
  const [counts, setCounts] = useState({
    lectures: 1,
    years: 1,
    tutorials: 1,
  });

  const runCountAnimation = useCallback(() => {
    const duration = 1400; // 1.4s total count duration
    const startTime = performance.now();

    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      const lectures = Math.floor(1 + ease * (600 - 1));
      // Discrete progression for 1yr -> 2yrs -> 3yrs
      const years = progress < 0.42 ? 1 : progress < 0.8 ? 2 : 3;
      const tutorials = Math.floor(1 + ease * (100 - 1));

      setCounts({
        lectures: progress >= 1 ? 600 : lectures,
        years,
        tutorials: progress >= 1 ? 100 : tutorials,
      });

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, []);

  // Trigger counting animation strictly on scroll when statistics section enters viewport
  useEffect(() => {
    if (!statsRef.current) return;

    let wasIntersecting = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !wasIntersecting) {
          wasIntersecting = true;
          runCountAnimation();
        } else if (!entry.isIntersecting && wasIntersecting) {
          wasIntersecting = false;
          // Reset to initial count so it animates cleanly when scrolled back into view
          setCounts({ lectures: 1, years: 1, tutorials: 1 });
        }
      },
      {
        threshold: 0.15, // Trigger as soon as 15% of the stats bar is scrolled into view
      }
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [runCountAnimation]);

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
      {/* Background Ambient Video with Deep Midnight Navy Overlay & Subtle Scroll Parallax */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${Math.min(scrollY * 0.18, 90)}px) scale(1.05)` }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/assets/hero-pharmacy.png"
          className="w-full h-full object-cover object-center"
        >
          <source src="/assets/hero-video.mp4" type="video/mp4" />
        </video>
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

        {/* Main Display Headline with subtle bounce micro-interaction on hover */}
        <h1 className="font-['Montserrat',sans-serif] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto mb-5">
          Your Pharmacy School Resources,{' '}
          <span className="animate-text-shimmer hover-bounce-subtle drop-shadow-sm inline-block cursor-pointer select-none">
            All in One Place.
          </span>
        </h1>

        {/* Subtitle / Body text restored to former Inter font */}
        <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          Curated lecture notes, official past questions, and student-led video tutorials structured for every pharmacy student from 100L to 600L at ABUAD
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

        {/* Live Academic Statistics Bar with Scroll-Triggered Count Micro-Interactions */}
        <div
          ref={statsRef}
          className="w-full max-w-4xl border-t border-white/15 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-['Montserrat',sans-serif] text-white tracking-tight leading-none mb-1 tabular-nums whitespace-nowrap">
              {counts.lectures}+
            </span>
            <span className="text-xs sm:text-sm text-white/80 whitespace-nowrap">Lecture PDFs</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-['Montserrat',sans-serif] text-white tracking-tight leading-none mb-1 tabular-nums whitespace-nowrap">
              {counts.years === 1 ? '1yr' : `${counts.years}yrs`}
            </span>
            <span className="text-xs sm:text-sm text-white/80 whitespace-nowrap">Past Questions</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-['Montserrat',sans-serif] text-white tracking-tight leading-none mb-1 tabular-nums whitespace-nowrap">
              {counts.tutorials}+
            </span>
            <span className="text-xs sm:text-sm text-white/80 whitespace-nowrap">Tutorial Sessions</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-['Montserrat',sans-serif] text-[#C084FC] tracking-tight leading-none mb-1 whitespace-nowrap">
              100L - 600L
            </span>
            <span className="text-xs sm:text-sm text-white/80 whitespace-nowrap">All Study Levels</span>
          </div>
        </div>
      </div>
    </section>
  );
}
