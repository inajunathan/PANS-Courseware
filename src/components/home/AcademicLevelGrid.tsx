'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, FolderOpen, SlidersHorizontal } from 'lucide-react';

interface LevelConfig {
  level: string;
  name: string;
  coursesCount: number;
  description: string;
  semesters: string;
  watermark: React.ReactNode;
}

const levels: LevelConfig[] = [
  {
    level: '100L',
    name: 'Pre-Pharmacy & Basic Sciences',
    coursesCount: 14,
    description: 'Foundational General Chemistry, Organic Chemistry, Plant Biology, Medical Physics, and Introductory Cell Biology.',
    semesters: 'First & Second Semesters',
    watermark: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 100 100">
        <polygon points="50 10, 85 30, 85 70, 50 90, 15 70, 15 30" />
        <polygon points="50 25, 72 38, 72 62, 50 75, 28 62, 28 38" />
        <circle cx="50" cy="50" fill="currentColor" opacity="0.35" r="10" />
        <circle cx="85" cy="30" fill="currentColor" opacity="0.4" r="3.5" />
        <circle cx="15" cy="70" fill="currentColor" opacity="0.4" r="3.5" />
      </svg>
    )
  },
  {
    level: '200L',
    name: 'Introductory Pharmaceutical Sciences',
    coursesCount: 18,
    description: 'Human Anatomy, Human Physiology, Pharmaceutical Microbiology fundamentals, Physical Pharmacy, and Biochemistry.',
    semesters: 'Core Professional Entry',
    watermark: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 100 100">
        <rect x="25" y="20" width="30" height="60" rx="15" transform="rotate(-30 40 50)" />
        <line x1="28" y1="40" x2="62" y2="60" strokeDasharray="3 3" />
        <circle cx="75" cy="25" fill="currentColor" opacity="0.35" r="8" />
        <circle cx="20" cy="75" fill="currentColor" opacity="0.35" r="6" />
      </svg>
    )
  },
  {
    level: '300L',
    name: 'Core Pharmaceutical Sciences I',
    coursesCount: 22,
    description: 'Pharmacognosy & Phytochemistry, Introductory Pharmacology (PCO 301), Medicinal Chemistry I, and Pharmaceutical Technology basics.',
    semesters: 'First & Second Semesters',
    watermark: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 100 100">
        <polygon points="35 20, 60 35, 60 65, 35 80, 10 65, 10 35" />
        <polygon points="60 35, 85 20, 100 35, 100 65, 85 80, 60 65" />
        <line x1="22" y1="42" x2="22" y2="58" strokeWidth="2" />
        <line x1="48" y1="28" x2="30" y2="72" strokeWidth="2" />
      </svg>
    )
  },
  {
    level: '400L',
    name: 'Core Pharmaceutical Sciences II',
    coursesCount: 24,
    description: 'Structure-Activity Relationships (PCH 401), Advanced Pharmacology & Chemotherapy (PCO 401), Biopharmaceutics, and Pharmacokinetics.',
    semesters: 'First & Second Semesters',
    watermark: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="30" strokeDasharray="4 2" />
        <path d="M 30 50 Q 50 20 70 50 T 90 50" strokeWidth="2" />
        <circle cx="50" cy="35" r="6" fill="currentColor" opacity="0.4" />
        <line x1="50" y1="41" x2="50" y2="65" strokeWidth="2.5" />
        <circle cx="50" cy="65" r="5" fill="currentColor" opacity="0.5" />
      </svg>
    )
  },
  {
    level: '500L',
    name: 'Advanced Clinical Studies',
    coursesCount: 20,
    description: 'Therapeutic Drug Monitoring, Clinical Pharmacokinetics, Applied Pharmacology, Hospital Pharmacy, and Toxicology.',
    semesters: 'First & Second Semesters',
    watermark: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 100 100">
        <path d="M 20 80 Q 50 10 80 80" strokeWidth="2" />
        <line x1="15" y1="80" x2="85" y2="80" strokeWidth="2" />
        <circle cx="50" cy="45" r="8" fill="currentColor" opacity="0.4" />
        <circle cx="35" cy="65" r="5" fill="currentColor" opacity="0.3" />
        <circle cx="65" cy="65" r="5" fill="currentColor" opacity="0.3" />
      </svg>
    )
  },
  {
    level: '600L',
    name: 'Clinical Clerkship Year',
    coursesCount: 16,
    description: 'Advanced Clinical Ward Rounds, Pharmacotherapy, Patient Care Rotations, Pharmacoepidemiology, and Clinical Seminars.',
    semesters: 'PharmD Clerkship Year',
    watermark: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" strokeWidth="1.5" />
        <path d="M 50 20 L 50 80 M 30 40 L 70 40" strokeWidth="3" />
        <path d="M 35 60 Q 50 75 65 60" strokeWidth="2" fill="none" />
      </svg>
    )
  }
];

export default function AcademicLevelGrid() {
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [activeScrollLevel, setActiveScrollLevel] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  // Detect mobile viewport (< 768px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track scroll position on mobile viewport only
  useEffect(() => {
    if (!isMobile) {
      setActiveScrollLevel(null);
      return;
    }

    let rafId: number;

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight * 0.5;
        let closestLevel: string | null = null;
        let minDistance = Infinity;

        cardsRef.current.forEach((card, index) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          if (rect.bottom > 60 && rect.top < window.innerHeight - 60) {
            const cardCenter = rect.top + rect.height / 2;
            const distance = Math.abs(cardCenter - viewportCenter);
            if (distance < minDistance) {
              minDistance = distance;
              closestLevel = levels[index].level;
            }
          }
        });

        // Activate if the card is in the central reading zone on mobile
        const maxThreshold = window.innerHeight * 0.45;
        if (closestLevel && minDistance < maxThreshold) {
          setActiveScrollLevel(closestLevel);
        } else {
          setActiveScrollLevel(null);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  return (
    <section className="w-full py-16 md:py-24 bg-[#eff4ff]/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="font-['Montserrat',sans-serif] text-2xl sm:text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight">
              Explore by Academic Level
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Direct access to your semester PDF files &amp; slides, lecture archives, and study notes.
            </p>
          </div>
          <div className="mt-2 md:mt-0">
            <span className="text-xs sm:text-sm font-medium text-slate-700 bg-white px-4 py-2 rounded-full shadow-xs border border-slate-200 inline-flex items-center gap-2 transition-all">
              <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
              <span>Showing all 6 Professional Levels</span>
            </span>
          </div>
        </div>

        {/* 6 Level Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((item, index) => {
            // Desktop: Pure hover (returns to static resting state immediately on cursor leave)
            // Mobile: Scroll-driven activation when card is in focal view + touch
            const isHovered = hoveredLevel === item.level;
            const isScrollActive = isMobile && activeScrollLevel === item.level;
            const isCardActive = isMobile ? (isScrollActive || isHovered) : isHovered;
            const levelNum = item.level.replace('L', '');

            return (
              <Link
                key={item.level}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                href={`/courses?level=${levelNum}`}
                onMouseEnter={() => setHoveredLevel(item.level)}
                onMouseLeave={() => setHoveredLevel(null)}
                onTouchStart={() => setHoveredLevel(item.level)}
                className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 ease-out flex flex-col justify-between border shadow-sm ${
                  isMobile
                    ? isCardActive
                      ? 'scale-[1.03] shadow-2xl z-10'
                      : 'scale-[0.95] opacity-90'
                    : isCardActive
                    ? '-translate-y-1.5 shadow-xl'
                    : 'hover:-translate-y-1.5 hover:shadow-xl'
                }`}
                style={{
                  background: 'linear-gradient(135deg, rgb(237, 228, 255) 0%, rgb(244, 237, 255) 50%, rgb(250, 245, 255) 100%)',
                  borderColor: isCardActive ? 'rgba(168, 85, 247, 0.8)' : 'rgba(192, 132, 252, 0.45)',
                  boxShadow: isCardActive
                    ? '0 20px 35px -8px rgba(76, 29, 149, 0.4), 0 0 15px rgba(168, 85, 247, 0.25)'
                    : '0 2px 8px rgba(15, 23, 42, 0.04)'
                }}
              >
                {/* Signature Deep Purple Gradient Active / Hover Overlay */}
                <div
                  className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500 ease-out ${
                    isCardActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #4c1d95 0%, #3b0764 100%)'
                  }}
                />

                {/* Subtle Decorative Molecular Watermark */}
                <div
                  className={`absolute -right-6 -bottom-6 w-36 h-36 pointer-events-none transition-all duration-500 transform ${
                    isCardActive
                      ? 'opacity-30 text-purple-200 rotate-12 scale-110'
                      : 'opacity-15 text-[#6B21A8] group-hover:opacity-30 group-hover:text-purple-200 group-hover:rotate-12 group-hover:scale-110'
                  }`}
                >
                  {item.watermark}
                </div>

                <div className="relative z-10">
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`font-['Montserrat',sans-serif] text-3xl font-extrabold tracking-tight transition-colors duration-300 ${
                        isCardActive ? 'text-white' : 'text-[#581c87] group-hover:text-white'
                      }`}
                    >
                      {item.level}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all duration-300 backdrop-blur-sm ${
                        isCardActive
                          ? 'bg-white/25 text-white border border-white/40 shadow-xs'
                          : 'bg-[#e9d5ff]/80 text-[#581c87] border border-[#c084fc]/40 group-hover:bg-white/25 group-hover:text-white group-hover:border-white/40'
                      }`}
                    >
                      <FolderOpen className={`w-3.5 h-3.5 transition-colors ${
                        isCardActive ? 'text-purple-200' : 'text-[#7C3AED] group-hover:text-purple-200'
                      }`} />
                      <span>{item.coursesCount} Courses</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`font-['Montserrat',sans-serif] text-lg font-bold transition-colors duration-300 mb-2 ${
                      isCardActive ? 'text-white' : 'text-[#581c87] group-hover:text-white'
                    }`}
                  >
                    {item.name}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm line-clamp-2 leading-relaxed mb-6 transition-colors duration-300 ${
                      isCardActive ? 'text-[#f3e8ff]' : 'text-slate-600 group-hover:text-[#f3e8ff]'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Bottom Card Footer */}
                <div
                  className={`relative z-10 pt-4 flex items-center justify-between text-xs sm:text-sm font-medium border-t transition-colors duration-300 ${
                    isCardActive
                      ? 'border-white/20 text-white'
                      : 'border-[#d8b4fe]/50 text-[#581c87] group-hover:border-white/20 group-hover:text-white'
                  }`}
                >
                  <span>{item.semesters}</span>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isCardActive
                        ? 'bg-white/25 border border-white/40 text-white shadow-[0_0_12px_rgba(255,255,255,0.4)] translate-x-1'
                        : 'bg-white/80 border border-[#c084fc]/30 text-[#581c87] group-hover:bg-white/25 group-hover:border-white/40 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.4)] group-hover:translate-x-1'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
