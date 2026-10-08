'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { tutorialsData } from '@/data/tutorialsData';
import { Play, Clock, Eye, ArrowRight, UserCheck } from 'lucide-react';

export default function TutorialShowcaseSection() {
  const tutorials = tutorialsData.slice(0, 3);
  const [hoveredTutorialId, setHoveredTutorialId] = useState<string | null>(null);
  const [activeScrollTutorialId, setActiveScrollTutorialId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamically activate tutorial card interaction on mobile viewport as user scrolls through the section
  useEffect(() => {
    if (!isMobile) {
      setActiveScrollTutorialId(null);
      return;
    }

    let rafId: number;

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight * 0.5;
        let closestId: string | null = null;
        let minDistance = Infinity;

        cardsRef.current.forEach((card, index) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          if (rect.bottom > 80 && rect.top < window.innerHeight - 80) {
            const cardCenter = rect.top + rect.height / 2;
            const distance = Math.abs(cardCenter - viewportCenter);
            if (distance < minDistance) {
              minDistance = distance;
              closestId = tutorials[index]?.id || null;
            }
          }
        });

        if (closestId && minDistance < window.innerHeight * 0.35) {
          setActiveScrollTutorialId(closestId);
        } else {
          setActiveScrollTutorialId(null);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [tutorials, isMobile]);

  return (
    <section className="w-full py-16 md:py-20 bg-[#FAF5FF] border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="font-['Montserrat',sans-serif] text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Master Difficult Concepts with Peer Scholars
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Step-by-step video breakdowns of reaction mechanisms, pharmacokinetics calculations, and pharmacology pathways.
            </p>
          </div>
          <Link
            href="/tutorials"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#6B21A8] group"
          >
            <span>Explore All Tutorials</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tutorials.map((video, index) => {
            const isCardActive = isMobile
              ? activeScrollTutorialId === video.id
              : hoveredTutorialId === video.id;

            return (
              <div
                key={video.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                onMouseEnter={() => {
                  if (!isMobile) setHoveredTutorialId(video.id);
                }}
                onMouseLeave={() => {
                  if (!isMobile) setHoveredTutorialId(null);
                }}
                onTouchStart={() => setHoveredTutorialId(video.id)}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-500 ease-out flex flex-col justify-between group ${
                  isMobile
                    ? isCardActive
                      ? 'border-[#7C3AED] shadow-2xl scale-[1.03] z-10 ring-2 ring-[#7C3AED]/30'
                      : 'border-purple-200/70 shadow-xs scale-[0.95] opacity-90'
                    : isCardActive
                    ? 'border-[#7C3AED] shadow-xl -translate-y-2 ring-2 ring-[#7C3AED]/20'
                    : 'border-purple-200/70 shadow-sm hover:shadow-md hover:-translate-y-1'
                }`}
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className={`w-full h-full object-cover transition-transform duration-500 opacity-90 ${
                      isCardActive ? 'scale-105' : 'group-hover:scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isCardActive
                          ? 'scale-115 bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]'
                          : 'bg-white/90 text-[#7C3AED] group-hover:scale-110 group-hover:bg-[#7C3AED] group-hover:text-white'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  {/* Course Code Tag */}
                  <div className="absolute top-2.5 left-2.5 bg-[#7C3AED] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                    {video.courseCode}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{video.duration}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6B21A8] uppercase tracking-wider block mb-1">
                      {video.category}
                    </span>
                    <h3 className="font-['Montserrat',sans-serif] text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#630ed4] transition-colors line-clamp-2 mb-3">
                      {video.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{video.tutor}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{video.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
