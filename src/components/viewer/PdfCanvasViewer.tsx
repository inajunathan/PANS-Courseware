'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Maximize2, 
  RotateCw, 
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Smartphone,
  Check
} from 'lucide-react';

interface PdfCanvasViewerProps {
  pdfUrl: string;
  title?: string;
  courseCode?: string;
  academicYear?: string;
  department?: string;
  totalPagesCount?: number;
}

export default function PdfCanvasViewer({
  pdfUrl,
  title = 'Past Examination Question Paper',
  courseCode = 'PCH 401',
  academicYear = '2024/2025',
  department = 'College of Pharmacy',
  totalPagesCount = 1
}: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(totalPagesCount);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>(pdfUrl);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const renderTaskRef = useRef<any>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);

  // Initialize PDF.js and load document
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      setLoading(true);
      setErrorMsg(null);

      try {
        // Dynamically import Mozilla PDF.js in the browser
        const pdfjsLib = await import('pdfjs-dist');

        // Configure the PDF.js Web Worker
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjsLib.getDocument({
          url: activeUrl,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;

        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('PDF.js failed to load URL:', activeUrl, err);
        if (!isCancelled) {
          // If remote CORS blocked, provide a direct fallback to our local sample PDF
          if (activeUrl !== '/sample-past-question.pdf') {
            setActiveUrl('/sample-past-question.pdf');
          } else {
            setErrorMsg('Unable to render PDF preview directly. You can download the file or retry.');
            setLoading(false);
          }
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [activeUrl]);

  // Render the current page onto the HTML5 Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any previous in-flight render task
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignore cancellation error
      }
    }

    setRendering(true);

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Automatically scale to 100% of container width on mobile screens
      const containerWidth = containerRef.current
        ? containerRef.current.clientWidth
        : (typeof window !== 'undefined' ? window.innerWidth : 390);

      // Mobile padding compensation: 16px (8px each side) on mobile, 48px on desktop
      const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
      const padding = isMobile ? 16 : 48;
      const availableWidth = Math.max(containerWidth - padding, 260);

      const unscaledViewport = page.getViewport({ scale: 1.0 });
      // Fit to container width base scale
      const fitScale = availableWidth / unscaledViewport.width;

      // On mobile default is 100% screen fit; on desktop cap default base to 1.25
      const baseScale = isMobile ? fitScale : Math.min(fitScale, 1.25);
      const effectiveScale = Math.max(baseScale * zoomMultiplier, 0.45);

      const viewport = page.getViewport({ scale: effectiveScale });

      // Support high-DPI screens (Retina) for crisp mathematical & chemical formulas
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      const renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      setRendering(false);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Canvas render error:', err);
      }
      setRendering(false);
    }
  }, [pdfDoc, currentPage, zoomMultiplier]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Handle window resizing and orientation changes for responsive mobile preview
  useEffect(() => {
    let timeoutId: any;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        renderPage();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [renderPage]);

  // Touch Pinch-to-Zoom handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomMultiplier;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      const newZoom = Math.min(Math.max(touchStartZoomRef.current * ratio, 0.6), 2.8);
      setZoomMultiplier(Number(newZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  return (
    <div className="w-full flex flex-col items-center bg-[#FAF5FF] min-h-screen">
      {/* 1. Document Context Banner */}
      <section className="w-full bg-white border-b border-slate-200 shadow-xs z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#6B21A8] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED] text-white text-xs font-bold font-['Montserrat',sans-serif]">
                  {courseCode}
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-xs font-semibold text-[#6B21A8] bg-[#F3E8FF] px-2 py-0.5 rounded">
                  {academicYear}
                </span>
                <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hidden sm:inline-flex items-center gap-1 font-medium">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>PDF Document</span>
                </span>
              </div>
              <h1 className="font-['Montserrat',sans-serif] text-sm sm:text-lg font-bold text-[#0F172A] mt-0.5 truncate">
                {title}
              </h1>
              <p className="text-xs text-slate-500 truncate">{department}</p>
            </div>
          </div>

          {/* Direct Download Action Button (44px min-h touch target) */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <a
              href={activeUrl}
              download={`${courseCode}_${academicYear.replace('/', '_')}_PastQuestion.pdf`}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6B21A8] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
          </div>
        </div>

        {/* 2. Reader Controls Toolbar (Mobile-First Touch Target Optimizations) */}
        <div className="w-full bg-[#eff4ff]/90 backdrop-blur-md px-3 sm:px-6 py-2 flex items-center justify-between border-t border-slate-200 text-xs sm:text-sm gap-2 overflow-x-auto">
          {/* Page Selector & Navigation (min 44x44px touch targets) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs border border-slate-200 flex items-center justify-center active:scale-95"
              aria-label="Previous Page"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="h-11 min-h-[44px] flex items-center bg-white rounded-xl px-3 sm:px-4 shadow-2xs border border-slate-200 text-xs font-semibold select-none">
              <span className="text-[#6B21A8] font-bold text-sm sm:text-xs">{currentPage}</span>
              <span className="mx-1.5 text-slate-400">/</span>
              <span className="text-slate-600">{totalPages || 1}</span>
            </div>

            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs border border-slate-200 flex items-center justify-center active:scale-95"
              aria-label="Next Page"
              title="Next Page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop/Tablet Mobile Tag */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
            <Smartphone className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Mobile Canvas Auto-Scaled • Pinch to Zoom Enabled</span>
          </div>

          {/* Zoom Controls (min 44x44px touch targets) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
              <button
                disabled={zoomMultiplier <= 0.6}
                onClick={() => setZoomMultiplier((s) => Number(Math.max(s - 0.2, 0.6).toFixed(2)))}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8] disabled:opacity-30 transition-colors active:scale-95"
                aria-label="Zoom Out"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold text-xs text-slate-800 min-w-[50px] text-center select-none">
                {Math.round(zoomMultiplier * 100)}%
              </span>
              <button
                disabled={zoomMultiplier >= 2.5}
                onClick={() => setZoomMultiplier((s) => Number(Math.min(s + 0.2, 2.5).toFixed(2)))}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8] disabled:opacity-30 transition-colors active:scale-95"
                aria-label="Zoom In"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setZoomMultiplier(1.0)}
              className="min-h-[44px] px-3.5 rounded-xl bg-white hover:bg-[#F3E8FF] hover:text-[#6B21A8] text-xs font-semibold text-slate-700 border border-slate-200 transition-colors hidden sm:flex items-center justify-center shadow-2xs"
            >
              Fit Width
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Canvas Viewport Area with Smooth Vertical Scrolling and Touch Pinch-to-Zoom */}
      <main
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex-1 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8 overflow-y-auto overscroll-contain touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-[#6B21A8]">
            <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
            <p className="font-['Montserrat',sans-serif] font-bold text-sm">
              Rendering Canvas Preview via Mozilla PDF.js...
            </p>
            <p className="text-xs text-slate-400">
              Auto-scaled to 100% viewport width • Pinch to zoom enabled
            </p>
          </div>
        )}

        {/* Error Fallback Box */}
        {errorMsg && !loading && (
          <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 max-w-lg text-center shadow-md my-8 sm:my-10">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="font-['Montserrat',sans-serif] text-base font-bold text-slate-800 mb-2">
              Preview Notice
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              {errorMsg}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setActiveUrl('/sample-past-question.pdf')}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6B21A8] text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Load Bundled Sample PDF
              </button>
              <a
                href={activeUrl}
                download
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center"
              >
                Download PDF
              </a>
            </div>
          </div>
        )}

        {/* The Standard HTML5 Canvas Element - 100% Width Scaled on Mobile */}
        <div
          className={`relative bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-slate-200/90 overflow-hidden transition-shadow duration-200 max-w-full ${
            loading ? 'hidden' : 'block'
          }`}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          {rendering && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="block max-w-full mx-auto select-none"
          />
        </div>

        {/* Canvas Footer Stamp & Mobile Gesture Hint */}
        {!loading && !errorMsg && (
          <div className="mt-4 pb-6 text-center text-xs text-slate-400 space-y-1">
            <p>Rendered with Mozilla PDF.js • Page {currentPage} of {totalPages}</p>
            <p className="sm:hidden text-[11px] text-slate-400">
              Pinch with two fingers to zoom in/out • Swipe vertically to scroll
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
