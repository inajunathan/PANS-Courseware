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
  Monitor, 
  Presentation, 
  Image as ImageIcon, 
  RotateCcw 
} from 'lucide-react';

export type SupportedFileType = 'pdf' | 'powerpoint' | 'word' | 'image' | 'generic';

/**
 * Detects file type from URL or path extension
 */
export function detectFileType(url: string): SupportedFileType {
  if (!url) return 'pdf';
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.pptx') || clean.endsWith('.ppt')) return 'powerpoint';
  if (clean.endsWith('.docx') || clean.endsWith('.doc')) return 'word';
  if (
    clean.endsWith('.png') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.svg') ||
    clean.endsWith('.gif')
  ) {
    return 'image';
  }
  return 'pdf';
}

interface PdfCanvasViewerProps {
  pdfUrl: string;
  title?: string;
  courseCode?: string;
  academicYear?: string;
  department?: string;
  totalPagesCount?: number;
}

/**
 * Normalizes document/PDF URL to stream through proxy if remote to bypass CORS
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

interface PdfPageItemProps {
  pageNumber: number;
  totalPages: number;
  pdfDoc: any;
  zoomMultiplier: number;
  containerWidth: number;
  onPageVisible: (pageNumber: number) => void;
  onPageClick: (pageNumber: number) => void;
}

function PdfPageItem({
  pageNumber,
  totalPages,
  pdfDoc,
  zoomMultiplier,
  containerWidth,
  onPageVisible,
  onPageClick,
}: PdfPageItemProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState<boolean>(pageNumber <= 2);
  const [rendering, setRendering] = useState<boolean>(false);
  const [rendered, setRendered] = useState<boolean>(false);
  const renderTaskRef = useRef<any>(null);

  // IntersectionObserver: trigger render when near viewport and update active page
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const renderObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsNearViewport(true);
        }
      },
      { rootMargin: '800px 0px 800px 0px' }
    );

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          onPageVisible(pageNumber);
        }
      },
      { threshold: 0.3 }
    );

    renderObserver.observe(el);
    visibilityObserver.observe(el);

    return () => {
      renderObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [pageNumber, onPageVisible]);

  // Render current PDF page onto HTML5 Canvas
  useEffect(() => {
    if (!isNearViewport || !pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignore cancellation error
      }
    }

    async function renderCanvas() {
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
        const padding = isMobile ? 16 : 48;
        const availableWidth = Math.max(containerWidth - padding, 260);

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const fitScale = availableWidth / unscaledViewport.width;
        const baseScale = isMobile ? fitScale : Math.min(fitScale, 1.25);
        const effectiveScale = Math.max(baseScale * zoomMultiplier, 0.45);

        const viewport = page.getViewport({ scale: effectiveScale });
        const outputScale = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderTask = page.render({
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (!isCancelled) {
          setRendering(false);
          setRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error:`, err);
        }
        if (!isCancelled) {
          setRendering(false);
        }
      }
    }

    renderCanvas();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [isNearViewport, pdfDoc, pageNumber, zoomMultiplier, containerWidth]);

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      ref={pageRef}
      className="scroll-mt-32 w-full flex flex-col items-center my-3 sm:my-4 transition-all"
    >
      <div
        onClick={() => onPageClick(pageNumber)}
        title={pageNumber < totalPages ? 'Click to advance to next page' : 'Last page'}
        className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-xl border border-slate-200/90 overflow-hidden cursor-pointer transition-all duration-200 max-w-full"
        style={{ minHeight: rendered ? undefined : '500px' }}
      >
        {/* Page indicator badge */}
        <div className="absolute top-3 right-3 z-20 bg-slate-900/75 hover:bg-slate-900 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 select-none pointer-events-none transition-opacity opacity-75 group-hover:opacity-100">
          <span>{pageNumber}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-300">{totalPages}</span>
        </div>

        {/* Next page hover hint */}
        {pageNumber < totalPages && (
          <div className="absolute bottom-3 right-3 z-20 bg-[#7C3AED]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1 select-none opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Next page</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Loading state for unrendered / rendering page */}
        {(!rendered || rendering) && (
          <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
            <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
            <span className="text-xs text-slate-500 font-medium">Loading page {pageNumber}...</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="block max-w-full mx-auto select-none"
        />
      </div>
    </div>
  );
}

export default function PdfCanvasViewer({
  pdfUrl,
  title = 'Academic Course Document',
  courseCode = 'PCH 401',
  academicYear = '2025/2026',
  department = 'College of Pharmacy',
  totalPagesCount = 1
}: PdfCanvasViewerProps) {
  const fileType = detectFileType(pdfUrl);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // PDF render mode: 'canvas' | 'embedded'
  const [renderMode, setRenderMode] = useState<'canvas' | 'embedded'>('canvas');
  // Office render engine: 'microsoft' | 'google'
  const [officeEngine, setOfficeEngine] = useState<'microsoft' | 'google'>('microsoft');

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(totalPagesCount);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const proxyUrl = getViewerPdfUrl(pdfUrl);
  const [activeUrl, setActiveUrl] = useState<string>(proxyUrl);

  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);

  // Sync activeUrl when pdfUrl prop changes
  useEffect(() => {
    setActiveUrl(getViewerPdfUrl(pdfUrl));
  }, [pdfUrl]);

  // Measure container width and keep updated on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    window.addEventListener('orientationchange', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, []);

  // Initialize PDF.js only when dealing with PDF files in canvas mode
  useEffect(() => {
    if (fileType !== 'pdf') {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadPdf() {
      if (renderMode !== 'canvas') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const pdfjsLib = await import('pdfjs-dist');

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
        console.warn('PDF.js canvas notice, switching to native embedded view:', err);
        if (!isCancelled) {
          setRenderMode('embedded');
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [activeUrl, renderMode, fileType]);

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
      const newZoom = Math.min(Math.max(touchStartZoomRef.current * ratio, 0.6), 2.5);
      setZoomMultiplier(Number(newZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Programmatic smooth scroll to a page (e.g. from arrow clicks or page click)
  const scrollToPage = useCallback((targetPage: number) => {
    const bounded = Math.max(1, Math.min(targetPage, totalPages));
    setCurrentPage(bounded);
    const element = document.getElementById(`pdf-page-${bounded}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalPages]);

  // Click on page advances to next page
  const handlePageClick = useCallback((clickedPage: number) => {
    if (clickedPage < totalPages) {
      scrollToPage(clickedPage + 1);
    }
  }, [totalPages, scrollToPage]);

  // IntersectionObserver triggers active visible page
  const handlePageVisible = useCallback((visiblePage: number) => {
    setCurrentPage(visiblePage);
  }, []);

  // Determine file extension for download naming
  const rawExt = pdfUrl.split('?')[0].split('#')[0].split('.').pop() || 'pdf';
  const cleanExt = rawExt.toLowerCase();
  const safeExt = ['pdf', 'pptx', 'ppt', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'webp', 'svg'].includes(cleanExt)
    ? cleanExt
    : 'pdf';
  const downloadFileName = `${courseCode.replace(/[^a-zA-Z0-9]/g, '_')}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.${safeExt}`;

  return (
    <div className="w-full flex flex-col items-center bg-[#FAF5FF] min-h-screen">
      {/* 1. Reader Controls Toolbar (Sticky under top navbar) */}
      {fileType === 'pdf' && renderMode === 'canvas' && (
        <div className="sticky top-16 z-30 w-full bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-200 text-xs sm:text-sm gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => scrollToPage(currentPage - 1)}
              className="w-10 h-10 min-w-[40px] rounded-xl bg-[#eff4ff] hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] disabled:opacity-30 disabled:pointer-events-none transition-all border border-slate-200 flex items-center justify-center active:scale-95"
              aria-label="Previous Page"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="h-10 min-h-[40px] flex items-center bg-white rounded-xl px-3 sm:px-4 border border-slate-200 text-xs font-semibold select-none shadow-2xs">
              <span className="text-[#6B21A8] font-bold text-sm sm:text-xs">{currentPage}</span>
              <span className="mx-1.5 text-slate-400">/</span>
              <span className="text-slate-600">{totalPages || 1}</span>
            </div>

            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => scrollToPage(currentPage + 1)}
              className="w-10 h-10 min-w-[40px] rounded-xl bg-[#eff4ff] hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] disabled:opacity-30 disabled:pointer-events-none transition-all border border-slate-200 flex items-center justify-center active:scale-95"
              aria-label="Next Page"
              title="Next Page (or click on page)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
            <Smartphone className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Scroll vertically • Click page or arrows to advance</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <button
                disabled={zoomMultiplier <= 0.6}
                onClick={() => setZoomMultiplier((s) => Number(Math.max(s - 0.2, 0.6).toFixed(2)))}
                className="w-10 h-10 min-w-[40px] flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8] disabled:opacity-30 transition-colors active:scale-95"
                aria-label="Zoom Out"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold text-xs text-slate-800 min-w-[48px] text-center select-none">
                {Math.round(zoomMultiplier * 100)}%
              </span>
              <button
                disabled={zoomMultiplier >= 2.5}
                onClick={() => setZoomMultiplier((s) => Number(Math.min(s + 0.2, 2.5).toFixed(2)))}
                className="w-10 h-10 min-w-[40px] flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600 hover:text-[#6B21A8] disabled:opacity-30 transition-colors active:scale-95"
                aria-label="Zoom In"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setZoomMultiplier(1.0)}
              className="h-10 px-3 rounded-xl bg-white hover:bg-[#F3E8FF] hover:text-[#6B21A8] text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-colors hidden sm:flex items-center justify-center"
            >
              Fit Width
            </button>

            <button
              onClick={() => setRenderMode('embedded')}
              className="h-10 px-3 rounded-xl bg-white hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] text-xs font-semibold border border-slate-200 shadow-2xs transition-all active:scale-95 hidden sm:flex items-center gap-1.5"
              title="Toggle Native Browser PDF Mode"
            >
              <Monitor className="w-4 h-4 text-[#7C3AED]" />
              <span>Native Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Mode Toolbar */}
      {fileType === 'pdf' && renderMode === 'embedded' && (
        <div className="sticky top-16 z-30 w-full bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-200 text-xs sm:text-sm shadow-2xs">
          <span className="text-xs text-slate-600 font-medium">Native Browser PDF Engine Active</span>
          <button
            onClick={() => setRenderMode('canvas')}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-[#F3E8FF] text-slate-700 hover:text-[#6B21A8] text-xs font-semibold border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-4 h-4 text-[#7C3AED]" />
            <span>Switch to Canvas Mode</span>
          </button>
        </div>
      )}

      {/* Image Viewer Toolbar */}
      {fileType === 'image' && (
        <div className="sticky top-16 z-30 w-full bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-200 text-xs sm:text-sm gap-2 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">High-Resolution Image Preview</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
              <button
                disabled={zoomMultiplier <= 0.4}
                onClick={() => setZoomMultiplier((s) => Math.max(s - 0.2, 0.4))}
                className="w-10 h-10 flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold text-xs text-slate-800 min-w-[50px] text-center select-none">
                {Math.round(zoomMultiplier * 100)}%
              </span>
              <button
                disabled={zoomMultiplier >= 3.0}
                onClick={() => setZoomMultiplier((s) => Math.min(s + 0.2, 3.0))}
                className="w-10 h-10 flex items-center justify-center hover:bg-[#F3E8FF] text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setZoomMultiplier(1.0)}
              className="h-10 px-3 rounded-xl bg-white hover:bg-[#F3E8FF] text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Document Viewport Area */}

      {/* CASE A: PowerPoint or Word Document */}
      {(fileType === 'powerpoint' || fileType === 'word') ? (
        <main className="w-full max-w-7xl flex-1 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[80vh] sm:min-h-[85vh]">
            <iframe
              src={
                officeEngine === 'microsoft'
                  ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pdfUrl)}`
                  : `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
              }
              className="w-full flex-1 min-h-[80vh] sm:min-h-[85vh] border-0 rounded-2xl"
              title={`${title} - Document Viewer`}
            />
          </div>
          <div className="mt-3 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-3">
            <span>Powered by {officeEngine === 'microsoft' ? 'Microsoft Office Online' : 'Google Docs Viewer'}</span>
            <span>•</span>
            <button
              onClick={() => setOfficeEngine(officeEngine === 'microsoft' ? 'google' : 'microsoft')}
              className="text-[#7C3AED] hover:underline font-semibold"
            >
              Switch to {officeEngine === 'microsoft' ? 'Google Docs Engine' : 'Microsoft Office Online'}
            </button>
          </div>
        </main>
      ) : fileType === 'image' ? (
        /* CASE B: Scientific Diagram / Image */
        <main className="w-full max-w-7xl flex-1 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8 overflow-auto">
          <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-8 flex flex-col items-center justify-center min-h-[75vh] overflow-auto">
            <img
              src={proxyUrl}
              alt={title}
              style={{ transform: `scale(${zoomMultiplier})`, transformOrigin: 'center center' }}
              className="max-w-full h-auto object-contain rounded-xl transition-transform duration-200 shadow-sm select-none"
            />
          </div>
        </main>
      ) : renderMode === 'embedded' ? (
        /* CASE C1: PDF in Native Browser Mode */
        <main className="w-full max-w-7xl flex-1 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[80vh] sm:min-h-[85vh]">
            <iframe
              src={proxyUrl}
              className="w-full flex-1 min-h-[80vh] sm:min-h-[85vh] border-0 rounded-2xl"
              title={`${title} - PDF Reader`}
            />
          </div>
        </main>
      ) : (
        /* CASE C2: PDF in Mozilla PDF.js Canvas Continuous Scroll Mode */
        <main
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full max-w-5xl flex-1 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8 touch-pan-y"
        >
          {loading && (
            <div className="flex flex-col items-center gap-3 py-20 text-[#6B21A8]">
              <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
              <p className="font-['Montserrat',sans-serif] font-bold text-sm">
                Rendering PDF Document Preview...
              </p>
              <p className="text-xs text-slate-400">
                Continuous page scroll & click-to-advance enabled
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
              </div>
            </div>
          )}

          {/* Continuous Multi-Page Scrollable View */}
          {!loading && !errorMsg && pdfDoc && (
            <div className="w-full flex flex-col items-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PdfPageItem
                  key={pageNum}
                  pageNumber={pageNum}
                  totalPages={totalPages}
                  pdfDoc={pdfDoc}
                  zoomMultiplier={zoomMultiplier}
                  containerWidth={containerWidth}
                  onPageVisible={handlePageVisible}
                  onPageClick={handlePageClick}
                />
              ))}

              <div className="mt-6 mb-12 text-center text-xs text-slate-400 space-y-1 select-none">
                <p>End of document • {totalPages} pages rendered</p>
                <p className="text-[11px] text-slate-400">
                  Scroll up or click Previous Page in toolbar to navigate back
                </p>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
