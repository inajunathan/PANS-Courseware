'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  AlertCircle,
  FileText,
  Loader2,
  Smartphone,
  ExternalLink,
  Layers,
  Monitor
} from 'lucide-react';

interface PdfCanvasViewerProps {
  pdfUrl: string;
  title?: string;
  courseCode?: string;
  academicYear?: string;
  department?: string;
  totalPagesCount?: number;
}

/**
 * Normalizes PDF URL to stream through proxy if remote to bypass CORS
 */
export function getViewerPdfUrl(url: string): string {
  if (!url) return '/sample-past-question.pdf';
  if (url.startsWith('/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('/api/pdf-proxy')) return url;
    return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
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

  // We support both high-fidelity Embedded Reader and Mozilla PDF.js Canvas Mode
  const [renderMode, setRenderMode] = useState<'canvas' | 'embedded'>('canvas');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(totalPagesCount);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const proxyUrl = getViewerPdfUrl(pdfUrl);
  const [activeUrl, setActiveUrl] = useState<string>(proxyUrl);

  const renderTaskRef = useRef<any>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);

  // Sync activeUrl when pdfUrl prop changes
  useEffect(() => {
    setActiveUrl(getViewerPdfUrl(pdfUrl));
  }, [pdfUrl]);

  // Initialize PDF.js and load document
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (renderMode !== 'canvas') {
        setLoading(false);
        return;
      }

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
        console.warn('PDF.js canvas loading notice for URL:', activeUrl, err);
        if (!isCancelled) {
          // If canvas parsing encounters an issue, automatically switch to native embedded iframe reader
          console.log('Switching to native embedded reader fallback for uploaded PDF');
          setRenderMode('embedded');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [activeUrl, renderMode]);

  // Render the current page onto the HTML5 Canvas
  const renderPage = useCallback(async () => {
    if (renderMode !== 'canvas' || !pdfDoc || !canvasRef.current) return;

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

      // Automatically scale to container width on mobile screens
      const containerWidth = containerRef.current
        ? containerRef.current.clientWidth
        : (typeof window !== 'undefined' ? window.innerWidth : 390);

      const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
      const padding = isMobile ? 16 : 48;
      const availableWidth = Math.max(containerWidth - padding, 260);

      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const fitScale = availableWidth / unscaledViewport.width;
      const baseScale = isMobile ? fitScale : Math.min(fitScale, 1.25);
      const effectiveScale = Math.max(baseScale * zoomMultiplier, 0.45);

      const viewport = page.getViewport({ scale: effectiveScale });
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
  }, [renderMode, pdfDoc, currentPage, zoomMultiplier]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Handle window resizing and orientation changes
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

  const downloadFileName = `${courseCode.replace(/[^a-zA-Z0-9]/g, '_')}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

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
                  <span>Verified PDF</span>
                </span>
              </div>
              <h1 className="font-['Montserrat',sans-serif] text-sm sm:text-lg font-bold text-[#0F172A] mt-0.5 truncate">
                {title}
              </h1>
              <p className="text-xs text-slate-500 truncate">{department}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap sm:flex-nowrap">
            {/* Toggle Reader Mode */}
            <button
              onClick={() => setRenderMode(renderMode === 'canvas' ? 'embedded' : 'canvas')}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] text-xs font-semibold border border-slate-200 transition-all active:scale-95"
              title="Toggle Reader Mode"
            >
              {renderMode === 'canvas' ? (
                <>
                  <Monitor className="w-4 h-4 text-[#7C3AED]" />
                  <span>Native PDF Mode</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 text-[#7C3AED]" />
                  <span>Canvas Mode</span>
                </>
              )}
            </button>

            {/* Fullscreen View in Dedicated Tab */}
            <a
              href={proxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] text-xs font-semibold border border-slate-200 transition-all active:scale-95"
              title="Open PDF in Fullscreen Tab"
            >
              <ExternalLink className="w-4 h-4 text-[#7C3AED]" />
              <span className="hidden sm:inline">Fullscreen</span>
            </a>

            {/* Direct Download Button */}
            <a
              href={pdfUrl}
              download={downloadFileName}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6B21A8] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* 2. Reader Controls Toolbar for Canvas Mode */}
        {renderMode === 'canvas' && (
          <div className="w-full bg-[#eff4ff]/90 backdrop-blur-md px-3 sm:px-6 py-2 flex items-center justify-between border-t border-slate-200 text-xs sm:text-sm gap-2 overflow-x-auto">
            {/* Page Navigation */}
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

            {/* Mobile Tag */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
              <Smartphone className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Canvas Auto-Scaled • Pinch to Zoom Enabled</span>
            </div>

            {/* Zoom Controls */}
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
        )}
      </section>

      {/* 3. Main Viewport Area */}
      {renderMode === 'embedded' ? (
        /* Native Browser Embedded PDF Viewport */
        <main className="w-full max-w-7xl flex-1 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[80vh] sm:min-h-[85vh]">
            <iframe
              src={proxyUrl}
              className="w-full flex-1 min-h-[80vh] sm:min-h-[85vh] border-0 rounded-2xl"
              title={`${title} - PDF Reader`}
            />
          </div>
          <div className="mt-3 text-center text-xs text-slate-500 flex items-center gap-2">
            <span>Powered by Native Browser PDF Engine</span>
            <span>•</span>
            <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="text-[#7C3AED] hover:underline font-semibold">
              Open Fullscreen
            </a>
          </div>
        </main>
      ) : (
        /* Mozilla PDF.js Canvas Viewport with Touch Pinch-to-Zoom */
        <main
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full flex-1 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8 overflow-y-auto overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3 py-20 text-[#6B21A8]">
              <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
              <p className="font-['Montserrat',sans-serif] font-bold text-sm">
                Rendering PDF Document Preview...
              </p>
              <p className="text-xs text-slate-400">
                Auto-scaled to 100% viewport width • Pinch to zoom enabled
              </p>
            </div>
          )}

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
                  onClick={() => setRenderMode('embedded')}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6B21A8] text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Switch to Native Reader
                </button>
                <a
                  href={pdfUrl}
                  download={downloadFileName}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center"
                >
                  Download PDF
                </a>
              </div>
            </div>
          )}

          {/* HTML5 Canvas Element */}
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

          {!loading && !errorMsg && (
            <div className="mt-4 pb-6 text-center text-xs text-slate-400 space-y-1">
              <p>Rendered with Mozilla PDF.js • Page {currentPage} of {totalPages}</p>
              <p className="sm:hidden text-[11px] text-slate-400">
                Pinch with two fingers to zoom in/out • Swipe vertically to scroll
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
