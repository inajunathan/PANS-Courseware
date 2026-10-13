'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { coursesData } from '@/data/coursesData';
import { fetchAllCourses } from '@/lib/coursesService';
import { Course } from '@/types';
import { BookOpen, FileText, ArrowRight, Video, CheckCircle2 } from 'lucide-react';

export default function FeaturedCoursesSection() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>(coursesData.slice(0, 3));

  useEffect(() => {
    let isCurrent = true;
    fetchAllCourses().then((courses) => {
      if (isCurrent && courses && courses.length > 0) {
        setFeaturedCourses(courses.slice(0, 3));
      }
    }).catch(() => {});
    return () => { isCurrent = false; };
  }, []);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [activeScrollCourseId, setActiveScrollCourseId] = useState<string | null>(null);
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

  // On mobile only, track scroll position to activate cards in view
  useEffect(() => {
    if (!isMobile) {
      setActiveScrollCourseId(null);
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
              closestId = featuredCourses[index]?.id || null;
            }
          }
        });

        if (closestId && minDistance < window.innerHeight * 0.35) {
          setActiveScrollCourseId(closestId);
        } else {
          setActiveScrollCourseId(null);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [featuredCourses, isMobile]);

  return (
    <section className="w-full py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="font-['Montserrat',sans-serif] text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Featured PDF Files &amp; Slides
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Verified course lecture slides, study notes, and PDF handouts for pharmacy students.
            </p>
          </div>
          <Link
            href="/courses"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#6B21A8] group"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3 Featured Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.map((course, index) => {
            const isCardActive = isMobile
              ? activeScrollCourseId === course.id
              : hoveredCourseId === course.id;

            return (
              <div
                key={course.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                onMouseEnter={() => {
                  if (!isMobile) setHoveredCourseId(course.id);
                }}
                onMouseLeave={() => {
                  if (!isMobile) setHoveredCourseId(null);
                }}
                onTouchStart={() => setHoveredCourseId(course.id)}
                className={`relative border rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 ease-out group ${
                  isMobile
                    ? isCardActive
                      ? 'bg-white border-[#C084FC] shadow-2xl scale-[1.03] z-10 ring-2 ring-[#C084FC]/40'
                      : 'bg-[#f8f9ff] border-slate-200 scale-[0.95] opacity-90'
                    : isCardActive
                    ? 'bg-white border-[#C084FC] shadow-xl -translate-y-1.5'
                    : 'bg-[#f8f9ff] border-slate-200 hover:shadow-lg hover:border-[#C084FC]/60 hover:-translate-y-1'
                }`}
              >
                {/* Full Card Clickable Overlay */}
                <Link
                  href={`/courses/${course.code.toLowerCase().replace(/\s+/g, '-')}`}
                  className="absolute inset-0 z-0 rounded-2xl"
                  aria-label={`View ${course.code}: ${course.title}`}
                />

                <div className="relative z-10 pointer-events-none">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-[#7c3aed] text-white text-xs font-bold font-['Montserrat',sans-serif]">
                      {course.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      {course.level}L • {course.semester} Semester
                    </span>
                  </div>

                  <h3 className="font-['Montserrat',sans-serif] text-base font-bold text-[#0F172A] group-hover:text-[#630ed4] transition-colors mb-2 line-clamp-1 pointer-events-auto">
                    <Link href={`/courses/${course.code.toLowerCase().replace(/\s+/g, '-')}`} className="hover:underline">
                      {course.title}
                    </Link>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="space-y-1.5 mb-6 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="truncate">{course.leadLecturer}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>{course.units} Credit Units • {course.department}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-200/80 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
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

                  <Link
                    href={`/courses/${course.code.toLowerCase().replace(/\s+/g, '-')}`}
                    className="p-2 rounded-lg bg-white group-hover:bg-[#7c3aed] text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-[#7c3aed] transition-colors shadow-xs"
                    title={`View ${course.code} Course Details`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
