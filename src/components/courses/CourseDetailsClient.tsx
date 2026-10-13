'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Course, LectureUnit, PastQuestion, TutorialVideo } from '@/types';
import { DbPastQuestion, fetchPastQuestionsByCourse } from '@/lib/pastQuestionsService';
import { fetchCourseByCode } from '@/lib/coursesService';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Video, 
  Download, 
  Eye, 
  GraduationCap, 
  FileCheck,
  Bookmark
} from 'lucide-react';

interface CourseDetailsClientProps {
  course: Course;
  relatedPQs: (PastQuestion | DbPastQuestion)[];
  relatedTutorials: TutorialVideo[];
}

export default function CourseDetailsClient({
  course,
  relatedPQs,
  relatedTutorials
}: CourseDetailsClientProps) {
  const [currentCourse, setCurrentCourse] = useState<Course>(course);
  const [currentPQs, setCurrentPQs] = useState<(PastQuestion | DbPastQuestion)[]>(relatedPQs);

  const [activeTab, setActiveTab] = useState<'units' | 'pqs' | 'tutorials' | 'books'>('units');
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [activeScrollUnitId, setActiveScrollUnitId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const unitsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Dynamically re-fetch the latest live course slides & past questions from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function refreshLive() {
      try {
        const [liveCourse, livePqs] = await Promise.all([
          fetchCourseByCode(course.code),
          fetchPastQuestionsByCourse(course.code),
        ]);
        if (isMounted) {
          if (liveCourse) {
            setCurrentCourse(liveCourse);
          }
          if (livePqs && livePqs.length > 0) {
            setCurrentPQs(livePqs);
          }
        }
      } catch (err) {
        console.warn('Live course reload warning:', err);
      }
    }
    refreshLive();
    return () => {
      isMounted = false;
    };
  }, [course.code]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track scroll position on mobile viewport to dynamically activate unit card on scrolling
  useEffect(() => {
    if (!isMobile) {
      setActiveScrollUnitId(null);
      return;
    }

    let rafId: number;

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const viewportCenter = window.innerHeight * 0.5;
        let closestId: string | null = null;
        let minDistance = Infinity;

        unitsRef.current.forEach((el, index) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          if (rect.bottom > 80 && rect.top < window.innerHeight - 80) {
            const elCenter = rect.top + rect.height / 2;
            const distance = Math.abs(elCenter - viewportCenter);
            if (distance < minDistance) {
              minDistance = distance;
              closestId = currentCourse.lectureUnits[index]?.id || null;
            }
          }
        });

        if (closestId && minDistance < window.innerHeight * 0.35) {
          setActiveScrollUnitId(closestId);
        } else {
          setActiveScrollUnitId(null);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [currentCourse.lectureUnits, isMobile]);

  return (
    <main className="flex-1 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#630ed4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course Library</span>
          </Link>
        </div>

        {/* Hero Banner for Course */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="px-3 py-1 rounded-lg bg-[#7c3aed] text-white font-['Montserrat',sans-serif] font-bold text-sm">
                  {currentCourse.code}
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#F3E8FF] text-[#6B21A8] font-semibold text-xs border border-[#E9D5FF]">
                  {currentCourse.level} Level
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#eff4ff] text-slate-700 font-semibold text-xs border border-slate-200">
                  {currentCourse.semester} Semester
                </span>
              </div>

              <h1 className="font-['Montserrat',sans-serif] text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
                {currentCourse.title}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {currentCourse.description}
              </p>

              {/* Faculty Credentials Bar */}
              <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-600 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#7C3AED]" />
                  <span><strong className="text-slate-800">Lead Faculty:</strong> {currentCourse.leadLecturer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                  <span><strong className="text-slate-800">Academic Units:</strong> {currentCourse.units} Credit Units</span>
                </div>
              </div>
            </div>

            {/* Action Widget */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto lg:w-64">
              <Link
                href={currentCourse.lectureUnits.length > 0 ? `/viewer/${currentCourse.lectureUnits[0].id}` : '/viewer'}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6B21A8] text-white text-sm font-semibold px-5 py-3.5 rounded-xl shadow-xs hover:shadow-md transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Launch PDF Viewer</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('units')}
            className={`flex items-center gap-2 px-5 py-3 font-['Montserrat',sans-serif] text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'units'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>PDF Files &amp; Slides ({currentCourse.lectureUnits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pqs')}
            className={`flex items-center gap-2 px-5 py-3 font-['Montserrat',sans-serif] text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pqs'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Past Exam Papers ({currentPQs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorials')}
            className={`flex items-center gap-2 px-5 py-3 font-['Montserrat',sans-serif] text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tutorials'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video Tutorials ({relatedTutorials.length})</span>
          </button>
        </div>

        {/* Tab Content 1: PDF Files & Slides */}
        {activeTab === 'units' && (
          <div className="space-y-4">
            {currentCourse.lectureUnits.length > 0 ? (
              currentCourse.lectureUnits.map((unit, index) => {
                const isScrollActive = activeScrollUnitId === unit.id;
                const isHoverActive = hoveredUnitId === unit.id;
                const isActive = isMobile ? isScrollActive : isHoverActive;
                const downloadUrl = unit.pdfUrl || currentCourse.pdf_storage_url || '/sample-past-question.pdf';

                return (
                  <div
                    key={unit.id}
                    ref={(el) => { unitsRef.current[index] = el; }}
                    onMouseEnter={() => !isMobile && setHoveredUnitId(unit.id)}
                    onMouseLeave={() => !isMobile && setHoveredUnitId(null)}
                    className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#4c1d95] to-[#3b0764] text-white border-purple-900 shadow-xl scale-[1.02]'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-['Montserrat',sans-serif] font-bold text-sm shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white text-[#4c1d95]'
                          : 'bg-[#FAF5FF] text-[#6B21A8] border border-[#E9D5FF]'
                      }`}>
                        {unit.unitNumber}
                      </div>

                      <div>
                        <h3 className={`font-['Montserrat',sans-serif] text-base sm:text-lg font-bold mb-1 transition-colors ${
                          isActive ? 'text-white' : 'text-[#0F172A]'
                        }`}>
                          {unit.title}
                        </h3>
                        <div className={`flex flex-wrap items-center gap-3 text-xs transition-colors ${
                          isActive ? 'text-purple-200' : 'text-slate-500'
                        }`}>
                          <span>By {unit.lecturer}</span>
                          <span>•</span>
                          <span>{unit.totalPages || 20} Pages</span>
                          <span>•</span>
                          <span>{unit.fileSize || '8.0 MB'}</span>
                          {unit.isVerified && (
                            <>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 font-semibold ${
                                isActive ? 'text-emerald-300' : 'text-emerald-600'
                              }`}>
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Verified PDF &amp; Slides</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href={`/viewer/${unit.id}`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                          isActive
                            ? 'bg-white text-[#4c1d95] hover:bg-purple-100'
                            : 'bg-[#7c3aed] hover:bg-[#6B21A8] text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View PDF &amp; Slides</span>
                      </Link>
                      <a
                        href={downloadUrl}
                        download={`${currentCourse.code}_Unit_${unit.unitNumber}_Slides.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                          isActive
                            ? 'bg-purple-800 text-white hover:bg-purple-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
                No lecture slide units uploaded for this course yet.
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Past Questions */}
        {activeTab === 'pqs' && (
          <div className="space-y-4">
            {currentPQs.length > 0 ? (
              currentPQs.map((pq: any) => {
                const sessionStr = pq.session || pq.academic_year || '2024/2025';
                const examTypeStr = pq.examType || pq.exam_type || 'Examination Paper';
                const titleStr = pq.courseTitle || pq.course_title || currentCourse.title;
                const examinersStr = pq.examiners || 'Departmental Examination Board';
                const pagesStr = pq.totalPages || pq.total_pages || 8;
                const sizeStr = pq.fileSize || pq.file_size || '2.4 MB';
                const pdfStorageUrl = pq.pdf_storage_url || '/sample-past-question.pdf';

                return (
                  <div
                    key={pq.id}
                    className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#6B21A8] text-xs font-bold font-['Montserrat',sans-serif]">
                          {sessionStr}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs font-semibold text-slate-600">{examTypeStr}</span>
                      </div>
                      <h3 className="font-['Montserrat',sans-serif] text-base font-bold text-[#0F172A] mb-1">
                        {titleStr}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Examiners: {examinersStr} • {pagesStr} Pages • {sizeStr}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href={`/past-questions/${pq.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#6B21A8] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Paper</span>
                      </Link>
                      <a
                        href={pdfStorageUrl}
                        download={`${currentCourse.code}_${sessionStr.replace(/[\/\s]+/g, '_')}_Exam.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center"
                        title="Download Paper PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
                No past questions currently uploaded for this course.
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Tutorials */}
        {activeTab === 'tutorials' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedTutorials.length > 0 ? (
              relatedTutorials.map((tut) => (
                <div
                  key={tut.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-900">
                    <img
                      src={tut.thumbnail}
                      alt={tut.title}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[11px] px-2 py-0.5 rounded font-mono">
                      {tut.duration}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-['Montserrat',sans-serif] text-base font-bold text-[#0F172A] mb-2">
                      {tut.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      By {tut.tutor} ({tut.tutorRole})
                    </p>
                    <Link
                      href={`/tutorials/${tut.id}`}
                      className="w-full py-2 bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#6B21A8] font-semibold text-xs rounded-lg transition-colors border border-[#E9D5FF] flex items-center justify-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Tutorial</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
                No recorded student video tutorials uploaded for this course yet.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
