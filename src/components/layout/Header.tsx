'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  ArrowRight, 
  ArrowUp,
  Menu, 
  X, 
  GraduationCap, 
  Command 
} from 'lucide-react';
import SearchModal from '@/components/search/SearchModal';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Past Questions', href: '/past-questions' },
    { name: 'Tutorials', href: '/tutorials' },
  ];

  const classLevels = [
    { label: '100L', href: '/courses?level=100' },
    { label: '200L', href: '/courses?level=200' },
    { label: '300L', href: '/courses?level=300' },
    { label: '400L', href: '/courses?level=400' },
    { label: '500L', href: '/courses?level=500' },
    { label: '600L', href: '/courses?level=600' },
  ];

  // Track window scroll for desktop & mobile interaction
  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const currentY = window.scrollY;
        setIsScrolled(currentY > 20);

        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const progress = Math.min(100, Math.max(0, (currentY / docHeight) * 100));
          setScrollProgress(progress);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Listen for global Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md shadow-purple-950/5 border-b border-slate-200/90'
            : 'bg-white/95 backdrop-blur-md border-b border-slate-200'
        }`}
      >
        {/* Dynamic Scroll Progress Bar */}
        <div
          className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#c084fc] transition-all duration-150 ease-out shadow-[0_0_8px_rgba(124,58,237,0.5)] z-50 pointer-events-none"
          style={{ width: `${scrollProgress}%` }}
        />

        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
            isScrolled ? 'h-16' : 'h-16 md:h-20'
          }`}
        >
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 select-none group min-h-[44px]">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#03152D] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#C084FC]" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl text-[#0F172A] tracking-tight leading-tight group-hover:text-[#630ed4] transition-colors">
                  PANS
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#7c3aed] uppercase tracking-wider leading-none">
                  Courseware
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || pathname.startsWith(`${link.href}/`) || (link.href === '/courses' && pathname.startsWith('/viewer'));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#F3E8FF] text-[#6B21A8] font-semibold shadow-xs'
                        : 'text-[#4a4455] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Trigger Search Button (Desktop) */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="relative hidden sm:flex items-center w-56 lg:w-72 pl-9 pr-3 py-2 bg-white border border-slate-200 hover:border-[#7c3aed] rounded-xl text-xs md:text-sm text-slate-400 hover:text-slate-600 shadow-2xs hover:shadow-xs transition-all duration-200 group text-left cursor-pointer min-h-[44px]"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-[#7c3aed] transition-colors pointer-events-none" />
              <span className="truncate">Search course, past papers...</span>
              <div className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs shrink-0">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            </button>

            {/* Mobile Quick Search Button (Min 44x44px Touch Target) */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="sm:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-[#7c3aed] hover:bg-[#F3E8FF] active:scale-95 transition-all"
              aria-label="Search Courseware"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop Primary CTA */}
            <Link
              href="/courses"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 bg-[#7c3aed] hover:bg-[#6B21A8] text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap min-h-[44px]"
            >
              <span>Explore Courseware</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Mobile Hamburger Menu Trigger (Min 44x44px Touch Target) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:text-[#630ed4] hover:bg-[#F3E8FF] active:scale-95 transition-all"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Mobile Animated Slide-in Drawer */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-white z-50 md:hidden shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#03152D] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4 text-[#C084FC]" />
            </div>
            <span className="font-['Montserrat',sans-serif] font-bold text-base text-[#0F172A]">
              PANS <span className="text-[#7c3aed]">Courseware</span>
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Quick Search in Drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsSearchModalOpen(true);
            }}
            className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 mb-2 rounded-xl bg-slate-50 hover:bg-[#FAF5FF] border border-slate-200 text-slate-500 text-xs text-left transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="truncate">Search course code, past questions...</span>
          </button>

          {navLinks.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(`${link.href}/`) || (link.href === '/courses' && pathname.startsWith('/viewer'));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#F3E8FF] text-[#6B21A8] shadow-2xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-[#0b1c30]'
                }`}
              >
                <span>{link.name}</span>
              </Link>
            );
          })}

          {/* Quick Class Levels */}
          <div className="pt-4 mt-3 border-t border-slate-100">
            <p className="px-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Curriculum Levels
            </p>
            <div className="grid grid-cols-3 gap-2 px-1">
              {classLevels.map((lvl) => (
                <Link
                  key={lvl.label}
                  href={lvl.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center justify-center rounded-xl bg-[#eff4ff] hover:bg-[#7C3AED] hover:text-white text-[#6B21A8] font-bold text-xs transition-colors shadow-2xs"
                >
                  {lvl.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Primary CTA in Drawer */}
          <div className="pt-4 mt-2">
            <Link
              href="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6B21A8] text-white text-sm font-bold py-3 px-4 rounded-xl shadow-sm transition-colors"
            >
              <span>Explore All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            College of Pharmacy • PANS Courseware Hub
          </p>
        </div>
      </nav>

      {/* Global Command Palette / Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Interactive Floating Scroll-to-Top Gauge (Appears on Scroll) */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 min-w-[44px] min-h-[44px] rounded-full bg-white/95 text-[#7C3AED] hover:text-white hover:bg-[#7C3AED] border border-purple-200/80 shadow-lg shadow-purple-950/10 backdrop-blur-md flex items-center justify-center transition-all duration-300 group active:scale-95 ${
          scrollProgress > 12 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll back to top"
        title={`Page scrolled ${Math.round(scrollProgress)}% - Click to return to top`}
      >
        {/* SVG Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#E9D5FF"
            strokeWidth="2.5"
            opacity="0.5"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeDasharray={125.6}
            strokeDashoffset={125.6 - (125.6 * scrollProgress) / 100}
            strokeLinecap="round"
            className="transition-all duration-150"
          />
        </svg>

        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform relative z-10" />
      </button>
    </>
  );
}
