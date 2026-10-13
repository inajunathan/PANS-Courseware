import React from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#03152D] text-white border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Institutional Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#126F9A] flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-6 h-6 text-[#32C5FF]" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Montserrat',sans-serif] font-bold text-xl tracking-tight text-white">
                  PANS Courseware
                </span>
                <span className="text-[11px] font-semibold text-[#32C5FF] uppercase tracking-wider">
                  Pharmaceutical Association of Nigeria Students
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              The centralized academic courseware and examination archive for pharmacy students. Maintained by the PANS Academic Committee.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm font-medium text-slate-300">
                The Dominium Era Administration
              </span>
              <img
                src="/assets/dominium-era-logo.png"
                alt="The Dominium Era Logo"
                className="h-7 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Academic Levels Column */}
          <div>
            <h3 className="font-['Montserrat',sans-serif] text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Curriculum Levels
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/courses?level=100" className="hover:text-[#C084FC] transition-colors">100L — Pre-Pharmacy</Link></li>
              <li><Link href="/courses?level=200" className="hover:text-[#C084FC] transition-colors">200L — Basic Medical Sciences</Link></li>
              <li><Link href="/courses?level=300" className="hover:text-[#C084FC] transition-colors">300L — Core Pharmaceutical Sciences I</Link></li>
              <li><Link href="/courses?level=400" className="hover:text-[#C084FC] transition-colors">400L — Core Pharmaceutical Sciences II</Link></li>
              <li><Link href="/courses?level=500" className="hover:text-[#C084FC] transition-colors">500L — Advanced Clinical Studies</Link></li>
              <li><Link href="/courses?level=600" className="hover:text-[#C084FC] transition-colors">600L — Clinical Clerkship Year</Link></li>
            </ul>
          </div>

          {/* Departments Column */}
          <div>
            <h3 className="font-['Montserrat',sans-serif] text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Departments
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/courses" className="hover:text-[#C084FC] transition-colors">Pharmaceutical Chemistry</Link></li>
              <li><Link href="/courses" className="hover:text-[#C084FC] transition-colors">Pharmaceutics & Tech</Link></li>
              <li><Link href="/courses" className="hover:text-[#C084FC] transition-colors">Pharmacology & Tox</Link></li>
              <li><Link href="/courses" className="hover:text-[#C084FC] transition-colors">Pharmacognosy & Herbal</Link></li>
              <li><Link href="/courses" className="hover:text-[#C084FC] transition-colors">Clinical Pharmacy</Link></li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div>
            <h3 className="font-['Montserrat',sans-serif] text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Archives & Tools
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/past-questions" className="hover:text-[#C084FC] transition-colors">Past Questions Vault</Link></li>
              <li><Link href="/tutorials" className="hover:text-[#C084FC] transition-colors">Student Video Tutorials</Link></li>
              <li><Link href="/viewer" className="hover:text-[#C084FC] transition-colors">PDF Reader & Viewer</Link></li>
              <li><Link href="/courses?semester=First" className="hover:text-[#C084FC] transition-colors">First Semester PDF Files &amp; Slides</Link></li>
              <li><Link href="/courses?semester=Second" className="hover:text-[#C084FC] transition-colors">Second Semester PDF Files &amp; Slides</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} PANS Courseware. Built for Academic Excellence.</p>
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <span>Maintained by the Academic Committee under the Dominium Era.</span>
            <img
              src="/assets/dominium-era-logo.png"
              alt="The Dominium Era Logo"
              className="h-6 sm:h-7 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity inline-block"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
