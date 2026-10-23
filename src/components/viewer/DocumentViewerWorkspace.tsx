'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Bookmark, 
  Layers, 
  FileText, 
  Printer, 
  Smartphone,
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  BookOpen,
  Presentation,
  Image as ImageIcon
} from 'lucide-react';
import PdfCanvasViewer, { detectFileType } from '@/components/viewer/PdfCanvasViewer';

export interface ViewerDocumentData {
  id?: string;
  title: string;
  courseCode: string;
  courseTitle?: string;
  academicYear: string;
  department: string;
  lecturer?: string;
  module?: string;
  totalPages: number;
  fileSize?: string;
  pdfUrl?: string;
  returnUrl?: string;
  chapterTitle?: string;
  leadParagraph?: string;
  highlights?: string[];
  examQuestions?: string[];
}

interface DocumentViewerWorkspaceProps {
  document: ViewerDocumentData;
}

export default function DocumentViewerWorkspace({ document }: DocumentViewerWorkspaceProps) {
  // Default to 'canvas' mode so the uploaded PDF is immediately visible!
  const [viewMode, setViewMode] = useState<'canvas' | 'interactive'>('canvas');
  const fileType = detectFileType(document.pdfUrl || '');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = document.totalPages || 28;
  const [zoomLevel, setZoomLevel] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([
    'Remember: Penam core beta-lactam ring tension is crucial for transpeptidase inhibition.',
    'Focus on steric hindrance of side chains preventing beta-lactamase hydrolysis.'
  ]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 65));
  const handleFitWidth = () => setZoomLevel(110);
  const handleFitPage = () => setZoomLevel(90);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      setSavedNotes([...savedNotes, noteText.trim()]);
      setNoteText('');
    }
  };

  const returnUrl = document.returnUrl || `/courses/${document.courseCode.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5FF] text-[#0b1c30]">
      {/* 1. Document Context Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Breadcrumbs & Lecture Metadata */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={returnUrl}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#eff4ff] text-slate-700 hover:bg-[#F3E8FF] hover:text-[#6B21A8] transition-colors shrink-0 flex items-center justify-center active:scale-95"
              title="Return to Course Hub"
              aria-label="Return to Course Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#6B21A8] text-xs font-bold tracking-wide font-['Montserrat',sans-serif]">
                  {document.courseCode}
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-600">{document.academicYear} Academic Session</span>
                <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hidden sm:inline-flex items-center gap-1">
                  {fileType === 'powerpoint' ? (
                    <>
                      <Presentation className="w-3.5 h-3.5 text-orange-600" />
                      <span>PowerPoint Slides</span>
                    </>
                  ) : fileType === 'word' ? (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Word Document</span>
                    </>
                  ) : fileType === 'image' ? (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Diagram / Image</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>Lecture PDF</span>
                    </>
                  )}
                </span>
              </div>

              <h1 className="font-['Montserrat',sans-serif] text-sm sm:text-base font-bold text-[#0F172A] truncate mt-0.5">
                {document.title}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {document.department}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0 justify-between sm:justify-end">
            <button
              onClick={() => setViewMode(viewMode === 'canvas' ? 'interactive' : 'canvas')}
              className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
                viewMode === 'interactive'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-[#eff4ff] text-slate-700 hover:bg-[#F3E8FF] hover:text-[#6B21A8]'
              }`}
            >
              {viewMode === 'canvas' ? (
                <>
                  <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                  <span>Text Summary</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>PDF Document</span>
                </>
              )}
            </button>

            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 active:scale-95 ${
                notesOpen
                  ? 'bg-[#6B21A8] text-white shadow-xs'
                  : 'bg-[#eff4ff] text-slate-700 hover:bg-[#F3E8FF] hover:text-[#6B21A8]'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Notes ({savedNotes.length})</span>
            </button>

            {viewMode === 'interactive' && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-700 hover:bg-[#F3E8FF] hover:text-[#6B21A8] transition-all flex items-center justify-center shrink-0 active:scale-95 ${
                  sidebarOpen ? 'bg-[#eff4ff]' : 'bg-slate-100'
                }`}
                title="Toggle Page Thumbnails"
                aria-label="Toggle Thumbnails"
              >
                <Layers className="w-4 h-4" />
              </button>
            )}

            {document.pdfUrl && (
              <a
                href={document.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3 rounded-xl bg-[#eff4ff] text-slate-700 hover:bg-[#F3E8FF] hover:text-[#6B21A8] transition-all flex items-center justify-center shrink-0 active:scale-95 text-xs font-semibold gap-1.5"
                title="Open PDF in Fullscreen Tab"
                aria-label="Open PDF in Fullscreen Tab"
              >
                <span>Fullscreen</span>
              </a>
            )}

            <button
              onClick={() => alert('Printing academic document...')}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#eff4ff] text-slate-700 hover:bg-[#F3E8FF] hover:text-[#6B21A8] transition-all flex items-center justify-center shrink-0 hidden md:flex active:scale-95"
              title="Print Document"
              aria-label="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>

            <a
              href={document.pdfUrl || '/sample-past-question.pdf'}
              download={`${document.courseCode}_${(document.chapterTitle || document.title).replace(/[^a-zA-Z0-9]/g, '_')}.${fileType === 'powerpoint' ? 'pptx' : fileType === 'word' ? 'docx' : fileType === 'image' ? 'png' : 'pdf'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6B21A8] active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs shrink-0 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>
                Download {fileType === 'powerpoint' ? 'PowerPoint' : fileType === 'word' ? 'Document' : fileType === 'image' ? 'Image' : 'PDF'}{' '}
                <span className="hidden sm:inline font-normal opacity-90">({document.fileSize || '8.4 MB'})</span>
              </span>
            </a>
          </div>
        </div>

        {/* 2. Secondary Reader Toolbar (Only for interactive text summary mode) */}
        {viewMode === 'interactive' && (
          <div className="w-full bg-[#eff4ff]/80 backdrop-blur-md px-3 sm:px-6 py-2 flex items-center justify-between border-t border-slate-200 text-xs sm:text-sm gap-2 overflow-x-auto">
            {/* Page Indicator & Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs border border-slate-200 flex items-center justify-center active:scale-95"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="h-11 min-h-[44px] flex items-center bg-white rounded-xl px-3 sm:px-4 shadow-2xs border border-slate-200 font-semibold text-slate-800 select-none">
                <span className="text-[#6B21A8] font-bold text-sm sm:text-xs">{currentPage}</span>
                <span className="mx-1.5 text-slate-400">/</span>
                <span className="text-slate-600">{totalPages}</span>
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs border border-slate-200 flex items-center justify-center active:scale-95"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
                <button
                  onClick={handleZoomOut}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8] transition-colors active:scale-95"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono font-bold text-xs text-[#0F172A] min-w-[50px] text-center select-none">
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8] transition-colors active:scale-95"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleFitWidth}
                className="hidden sm:flex min-h-[44px] px-3.5 items-center justify-center rounded-xl bg-white hover:bg-[#F3E8FF] hover:text-[#6B21A8] text-slate-700 font-semibold text-xs shadow-2xs border border-slate-200 transition-colors"
              >
                Fit Width
              </button>

              <button
                onClick={handleFitPage}
                className="hidden sm:flex min-h-[44px] px-3.5 items-center justify-center rounded-xl bg-white hover:bg-[#F3E8FF] hover:text-[#6B21A8] text-slate-700 font-semibold text-xs shadow-2xs border border-slate-200 transition-colors"
              >
                Fit Page
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. Interactive Document Workspace or Mozilla PDF.js Canvas Preview */}
      {viewMode === 'canvas' ? (
        <PdfCanvasViewer
          pdfUrl={document.pdfUrl || '/sample-past-question.pdf'}
          title={document.title}
          courseCode={document.courseCode}
          academicYear={document.academicYear}
          department={document.department}
          totalPagesCount={totalPages}
        />
      ) : (
        <div className="relative flex-1 flex overflow-hidden">
          {/* Left: Collapsible Page Thumbnails Sidebar */}
          {sidebarOpen && (
            <>
              {/* Mobile backdrop */}
              <div
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
                aria-hidden="true"
              />
              <aside className="fixed inset-y-0 left-0 z-50 md:relative md:z-auto w-64 md:w-56 lg:w-64 bg-white border-r border-slate-200 overflow-y-auto p-4 shrink-0 flex flex-col gap-3 shadow-2xl md:shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-['Montserrat',sans-serif] text-xs font-bold uppercase tracking-wider text-slate-500">
                    Thumbnails ({totalPages})
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 md:hidden"
                    aria-label="Close thumbnails"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 min-h-[44px] ${
                        currentPage === page
                          ? 'border-[#7C3AED] bg-[#FAF5FF] shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="aspect-[3/4] w-full bg-[#f8f9ff] border border-slate-200 rounded-lg p-2 flex flex-col justify-between overflow-hidden text-[8px] text-slate-400 select-none shadow-2xs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1 font-bold text-[#6B21A8]">
                          <span>{document.courseCode}</span>
                          <span>p.{page}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-slate-300 rounded w-4/5" />
                          <div className="h-1 bg-slate-200 rounded w-full" />
                          <div className="h-1 bg-slate-200 rounded w-2/3" />
                          <div className="h-4 bg-[#eff4ff] rounded border border-purple-100 flex items-center justify-center text-[7px] text-[#7C3AED] font-mono">
                            Structure
                          </div>
                        </div>
                        <div className="border-t border-slate-200 pt-1 text-[7px] text-right text-slate-400">
                          PANS Repository
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-center text-slate-700">
                        Page {page} {page === 1 ? '• Title & Core' : page === 2 ? '• Pharmacophore' : '• Mechanisms'}
                      </span>
                    </button>
                  ))}
                </div>
              </aside>
            </>
          )}

          {/* Center: Academic Document Viewport */}
          <main className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-10 flex flex-col items-center bg-[#f1f5f9]/70">
            <article
              className="w-full max-w-[920px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 sm:p-10 md:p-16 relative transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              {/* Institutional Header Stamp */}
              <header className="w-full pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#7C3AED] shadow-xs shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-['Montserrat',sans-serif] text-xs uppercase tracking-wider text-[#6B21A8] font-extrabold">
                      PANS Academic Repository
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      College of Pharmacy • University Campus
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#630ed4] font-mono text-xs uppercase tracking-wider font-bold border border-purple-100">
                    SEC: {document.courseCode}-OFFICIAL
                  </span>
                  <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded text-xs font-semibold border border-slate-200">
                    <span>Official Archive</span>
                  </div>
                </div>
              </header>

              {/* Document Main Chapter Title Block */}
              <section className="mb-10">
                <div className="inline-block px-3 py-1 rounded-full bg-[#F3E8FF] text-[#6B21A8] text-xs font-bold uppercase tracking-wider mb-3">
                  {document.chapterTitle || 'PDF Document & Slides'}
                </div>
                <h2 className="font-['Montserrat',sans-serif] text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-snug mb-3">
                  {document.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500 pb-4 border-b border-slate-100">
                  <span><strong>Department:</strong> {document.department}</span>
                  <span className="hidden sm:inline">•</span>
                  <span><strong>Module:</strong> {document.module || 'Undergraduate Study Material'}</span>
                </div>
              </section>

              {/* Lecture Body Text */}
              <section className="prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-5 mb-10">
                <p>
                  {document.leadParagraph || (
                    <>
                      <strong>Structure-Activity Relationship (SAR)</strong> is the systematic investigation of how modifications in the chemical architecture of a molecule affect its biological potency, target selectivity, metabolic stability, and pharmacokinetic behavior. In medicinal chemistry, the discovery of lead molecules initiates an iterative optimization campaign aimed at magnifying the therapeutic index while attenuating off-target affinities.
                    </>
                  )}
                </p>

                {/* Highlight Callout Box */}
                <div className="bg-[#FAF5FF] border-l-4 border-[#7C3AED] p-4 sm:p-5 rounded-r-xl my-6">
                  <h4 className="font-['Montserrat',sans-serif] text-sm font-bold text-[#6B21A8] mb-1.5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                    <span>Fundamental Postulates of Medicinal SAR:</span>
                  </h4>
                  <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                    <li><strong>The Pharmacophore:</strong> The minimal spatial arrangement of steric and electronic features necessary for receptor recognition and activation.</li>
                    <li><strong>The Auxophore:</strong> Auxiliary molecular frameworks that do not bind the primary active site directly but enhance solubility, bioavailability, or steric shielding.</li>
                    <li><strong>Bioisosteric Replacement:</strong> Substitutions of atoms or groups with similar physicochemical or valence properties (e.g. replacing -COOH with tetrazole).</li>
                  </ul>
                </div>

                {/* Chemical Structure Diagram Box */}
                <div className="my-8 p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#6B21A8] font-['Montserrat',sans-serif] uppercase tracking-wide">
                      Figure 1.1 — Penam Nucleus SAR Matrix &amp; Receptor Interaction Anchors
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">SCHEMATIC-01</span>
                  </div>

                  {/* SVG Chemical Schema */}
                  <div className="w-full flex items-center justify-center py-6 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
                    <svg className="w-full max-w-lg h-auto" viewBox="0 0 540 220" fill="none">
                      <rect x="180" y="70" width="80" height="70" rx="4" stroke="#6B21A8" strokeWidth="3" fill="#FAF5FF" />
                      <text x="195" y="112" fill="#6B21A8" fontSize="13" fontWeight="bold">β-Lactam</text>
                      <text x="188" y="128" fill="#6B21A8" fontSize="9">Strained Core</text>

                      <line x1="220" y1="70" x2="220" y2="40" stroke="#DC2626" strokeWidth="3" />
                      <line x1="226" y1="70" x2="226" y2="40" stroke="#DC2626" strokeWidth="3" />
                      <circle cx="223" cy="30" r="10" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" />
                      <text x="219" y="34" fill="#DC2626" fontSize="11" fontWeight="bold">O</text>

                      <polygon points="260,70 340,90 320,150 260,140" stroke="#2563EB" strokeWidth="3" fill="#EFF6FF" />
                      <circle cx="295" cy="85" r="9" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
                      <text x="291" y="89" fill="#854D0E" fontSize="11" fontWeight="bold">S</text>

                      <line x1="320" y1="150" x2="360" y2="180" stroke="#16A34A" strokeWidth="3" />
                      <rect x="360" y="165" width="85" height="30" rx="6" fill="#DCFCE7" stroke="#16A34A" strokeWidth="2" />
                      <text x="368" y="184" fill="#166534" fontSize="11" fontWeight="bold">C-3 COOH</text>
                      <text x="368" y="210" fill="#64748B" fontSize="9">Ionic Target Bond</text>

                      <line x1="180" y1="90" x2="110" y2="90" stroke="#7C3AED" strokeWidth="3" />
                      <rect x="20" y="70" width="90" height="40" rx="6" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="2" />
                      <text x="28" y="88" fill="#581C87" fontSize="11" fontWeight="bold">Acylamino (R)</text>
                      <text x="28" y="102" fill="#7C3AED" fontSize="8">Determines Spectrum</text>
                    </svg>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
                    <strong>Mechanistic Insight:</strong> Acylation of penicillin-binding proteins (PBPs) relies on the high thermodynamic ground-state strain of the four-membered beta-lactam ring.
                  </p>
                </div>

                <h3 className="font-['Montserrat',sans-serif] text-lg font-bold text-[#0F172A] pt-4">
                  1.2 Essential Exam Synthesis Questions
                </h3>
                <p>
                  In past degree examinations, students are consistently tested on the correlation between the steric volume of the R-sidechain and resistance against beta-lactamase enzymes:
                </p>
                <ul className="text-sm space-y-2 list-decimal list-inside pl-2 text-slate-700">
                  <li><strong>Steric Shielding:</strong> Ortho-dimethoxy substituents on methicillin prevent enzymatic access without impairing transpeptidase acylation.</li>
                  <li><strong>Electron-Withdrawing Groups:</strong> Incorporation of alpha-amino groups confers acid stability, facilitating oral bioabsorption.</li>
                  <li><strong>Broad Spectrum Activity:</strong> Hydrophilic polar additions facilitate passage through Gram-negative outer membrane OmpF and OmpC porin channels.</li>
                </ul>
              </section>

              {/* Document Footer */}
              <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <span>PANS Courseware Hub • Official Study Archive</span>
                <span className="font-semibold text-slate-700">Page {currentPage} of {totalPages}</span>
                <span>© {new Date().getFullYear()} College of Pharmacy</span>
              </footer>
            </article>
          </main>

          {/* Right: Notes Drawer */}
          {notesOpen && (
            <>
              {/* Mobile backdrop */}
              <div
                onClick={() => setNotesOpen(false)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
                aria-hidden="true"
              />
              <aside className="fixed inset-y-0 right-0 z-50 md:relative md:z-auto w-80 max-w-[85vw] lg:w-80 bg-white border-l border-slate-200 p-5 flex flex-col justify-between shrink-0 shadow-2xl md:shadow-lg">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-[#7C3AED]" />
                      <span className="font-['Montserrat',sans-serif] text-sm font-bold text-[#0F172A]">
                        Study Notes
                      </span>
                    </div>
                    <button
                      onClick={() => setNotesOpen(false)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-semibold text-slate-400 hover:text-slate-700"
                      aria-label="Close notes"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
                    {savedNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl text-xs text-slate-700 leading-relaxed shadow-2xs"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddNote} className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Add Personal Study Annotation:
                  </label>
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Type key takeaway or exam reminder..."
                    className="w-full p-2.5 bg-[#eff4ff]/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7c3aed] mb-2 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full min-h-[44px] py-2.5 bg-[#7C3AED] hover:bg-[#6B21A8] active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center"
                  >
                    Save Annotation
                  </button>
                </form>
              </aside>
            </>
          )}
        </div>
      )}
    </div>
  );
}
