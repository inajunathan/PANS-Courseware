import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { fetchTutorials, fetchTutorialById, DbTutorial } from '@/lib/tutorialsService';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Eye, 
  Video, 
  UserCheck, 
  Building, 
  BookOpen, 
  Sparkles, 
  Share2, 
  Download, 
  FileText,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

/**
 * Incremental Static Regeneration (ISR) configuration
 * Revalidates every 86400 seconds (24 hours).
 * This ensures thousands of student video tutorials & written study guides
 * are statically cached across Vercel's Edge CDN, never overloading Supabase.
 */
export const revalidate = 86400;

/**
 * Dynamic params set to true: any tutorial added to the database
 * after build will be generated on-demand and cached for 24 hours.
 */
export const dynamicParams = true;

/**
 * Pre-generate static routes at build time for existing tutorials.
 */
export async function generateStaticParams() {
  try {
    const { data } = await fetchTutorials();
    return data.map((t) => ({
      id: String(t.id),
    }));
  } catch (err) {
    console.error('Failed to generate static params for tutorials:', err);
    return [];
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Dynamic SEO metadata generation for each tutorial page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tutorial = await fetchTutorialById(id);

  if (!tutorial) {
    return {
      title: 'Tutorial Not Found | PANS Courseware',
      description: 'The requested student tutorial record could not be located.',
    };
  }

  const title = `${tutorial.title} (${tutorial.course_code || 'Pharmacy'}) | PANS Courseware`;
  const description = `Watch student-led tutorial and revision breakdown for ${tutorial.course_code} presented by ${tutorial.tutor_name || 'Academic Committee Scholar'}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${tutorial.course_code}: ${tutorial.title}`,
      description,
      type: 'video.other',
    },
  };
}

export default async function IndividualTutorialPage({ params }: PageProps) {
  const { id } = await params;
  const tutorial = await fetchTutorialById(id);

  if (!tutorial) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
        <Header />
        <main className="flex-1 pt-28 flex flex-col items-center justify-center p-4">
          <Video className="w-12 h-12 text-slate-400 mb-3" />
          <h2 className="font-['Montserrat',sans-serif] text-xl font-bold text-slate-800 mb-2">
            Tutorial Not Found
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            The requested student-led tutorial could not be located in our repository.
          </p>
          <Link
            href="/tutorials"
            className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6B21A8] transition-colors"
          >
            Return to Video Tutorials Hub
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Fetch related tutorials for recommendation block
  const allTutorialsRes = await fetchTutorials();
  const relatedTutorials = allTutorialsRes.data
    .filter((t) => t.id !== tutorial.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />

      <main className="flex-1 pt-20 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 mb-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/tutorials"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#630ed4] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tutorials Hub</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#6B21A8] font-bold font-['Montserrat',sans-serif]">
                {tutorial.course_code || 'PCH 401'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>{tutorial.duration || '45 min'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Stage: Player or Guide Reader (2 Columns) */}
            <div className="lg:col-span-2 space-y-6">
              {tutorial.content_type === 'video' ? (
                <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                  <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                    <img
                      src={
                        tutorial.id.includes('pch401')
                          ? 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80'
                          : tutorial.id.includes('pct401')
                          ? 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
                          : 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt={tutorial.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
                    
                    <div className="absolute flex flex-col items-center text-center p-6 max-w-lg z-10">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#7C3AED] hover:bg-[#6B21A8] text-white flex items-center justify-center shadow-xl mb-4 transition-all hover:scale-110 cursor-pointer">
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" />
                      </div>
                      <p className="text-white font-['Montserrat',sans-serif] font-bold text-lg sm:text-xl drop-shadow-md">
                        {tutorial.title}
                      </p>
                      <span className="text-purple-200 text-xs mt-1">
                        Click to start video stream with student-led annotations
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/80 text-xs font-mono font-bold text-white">
                      {tutorial.duration || '45:00'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#7C3AED] text-white text-xs font-bold uppercase tracking-wider">
                      Interactive Text Study Guide
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {tutorial.duration || '15 min read'}
                    </span>
                  </div>

                  <h1 className="font-['Montserrat',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#0F172A] mb-4 leading-tight">
                    {tutorial.title}
                  </h1>

                  <div className="prose prose-purple max-w-none text-slate-700 leading-relaxed space-y-4 pt-4 border-t border-slate-100">
                    <div className="p-4 rounded-2xl bg-[#eff4ff] border border-purple-100 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-slate-700">
                        <strong>Official Peer Review Checkpoint:</strong> This written revision package has been reviewed and verified by student academic coordinators for accuracy against the Faculty syllabus.
                      </div>
                    </div>

                    <p className="text-sm sm:text-base leading-relaxed">
                      {tutorial.written_content ||
                        'Welcome to this high-yield topic breakdown. This document covers fundamental mechanisms, core SAR relationships, thermodynamic equilibrium constants, and clinical case interpretations expected in semester exams.'}
                    </p>

                    <h3 className="text-base font-bold text-slate-900 mt-6">Core Review Highlights</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                      <li>Mechanisms of receptor interaction and stereochemical orientation.</li>
                      <li>Predictive SAR heuristics and functional group modifications.</li>
                      <li>Step-by-step past examination question breakdown and model solutions.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Title & Description Block */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <span className="px-3 py-1 rounded-lg bg-[#7c3aed] text-white font-['Montserrat',sans-serif] font-bold text-xs">
                    {tutorial.course_code || 'PCH 401'}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-[#eff4ff] text-[#6B21A8] font-semibold text-xs border border-[#E9D5FF]">
                    {tutorial.content_type === 'video' ? 'Video Lecture' : 'Study Guide'}
                  </span>
                </div>

                <h1 className="font-['Montserrat',sans-serif] text-xl sm:text-2xl font-bold text-[#0F172A] mb-3">
                  {tutorial.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <UserCheck className="w-4 h-4 text-[#7C3AED]" />
                    <span>{tutorial.tutor_name || 'Academic Committee Lead'}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{tutorial.department || 'Faculty of Pharmacy'}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Eye className="w-4 h-4" />
                    <span>{(tutorial.views || 1450).toLocaleString()} student views</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Details, Resources & Recommended Tutorials (1 Column) */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
                <h3 className="font-['Montserrat',sans-serif] text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Resource Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href={`/courses/${(tutorial.course_code || 'pch-401').toLowerCase().replace(/\s+/g, '-')}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#6B21A8] text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl transition-colors border border-[#E9D5FF]"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View Full Course Syllabus</span>
                  </Link>

                  <Link
                    href="/past-questions"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#eff4ff] hover:bg-[#e0ecff] text-[#1e40af] text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl transition-colors border border-blue-200"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Practice Related Past Exams</span>
                  </Link>
                </div>
              </div>

              {/* Related Tutorials */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
                <h3 className="font-['Montserrat',sans-serif] text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                  Recommended For You
                </h3>
                <div className="space-y-4">
                  {relatedTutorials.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/tutorials/${rel.id}`}
                      className="group block p-3 rounded-2xl hover:bg-[#FAF5FF] border border-transparent hover:border-[#E9D5FF] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {rel.content_type === 'video' ? (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#630ed4] transition-colors">
                            {rel.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {rel.tutor_name || 'Student Tutor'} • {rel.duration}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
