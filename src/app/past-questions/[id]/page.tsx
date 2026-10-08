import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PdfCanvasViewer from '@/components/viewer/PdfCanvasViewer';
import { fetchPastQuestions, fetchPastQuestionById } from '@/lib/pastQuestionsService';
import { ArrowLeft, FileQuestion, Calendar, Building } from 'lucide-react';

/**
 * Incremental Static Regeneration (ISR) configuration
 * Revalidates every 86400 seconds (24 hours).
 * This ensures thousands of past question resource pages are cached statically
 * on Vercel's Edge/Hobby tier, eliminating continuous database reads and only
 * hitting Supabase when a brand new question is added or updated.
 */
export const revalidate = 86400;

/**
 * Dynamic params set to true: pages not pre-rendered at build time
 * will be generated on-demand and cached statically for subsequent requests.
 */
export const dynamicParams = true;

/**
 * Pre-generate static routes at build time for existing past questions.
 */
export async function generateStaticParams() {
  try {
    const { data } = await fetchPastQuestions();
    return data.map((pq) => ({
      id: String(pq.id),
    }));
  } catch (error) {
    console.error('Failed to generate static params for past questions:', error);
    return [];
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Dynamic SEO metadata generation for each past question
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pastQuestion = await fetchPastQuestionById(id);

  if (!pastQuestion) {
    return {
      title: 'Past Question Not Found | PANS Courseware',
      description: 'The requested past examination record could not be loaded.',
    };
  }

  const title = `${pastQuestion.course_code}: ${pastQuestion.course_title} (${pastQuestion.academic_year}) | PANS Courseware`;
  const description = `Access verified past examination questions and marking guides for ${pastQuestion.course_code} - ${pastQuestion.course_title} (${pastQuestion.academic_year}), ${pastQuestion.department}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${pastQuestion.course_code}: ${pastQuestion.course_title}`,
      description,
      type: 'article',
    },
  };
}

export default async function IndividualPastQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const pastQuestion = await fetchPastQuestionById(id);

  if (!pastQuestion) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
        <Header />
        <main className="flex-1 pt-28 flex flex-col items-center justify-center p-4">
          <FileQuestion className="w-12 h-12 text-slate-400 mb-3" />
          <h2 className="font-['Montserrat',sans-serif] text-xl font-bold text-slate-800 mb-2">
            Past Question Not Found
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            The requested past examination record could not be loaded.
          </p>
          <Link
            href="/past-questions"
            className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6B21A8] transition-colors"
          >
            Return to Past Questions Vault
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />

      <main className="flex-1 pt-20">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/past-questions"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#630ed4] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Past Questions Vault</span>
            </Link>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>{pastQuestion.academic_year}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="truncate max-w-[200px]">{pastQuestion.department}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mozilla PDF.js Canvas Previewer */}
        <PdfCanvasViewer
          pdfUrl={pastQuestion.pdf_storage_url || '/sample-past-question.pdf'}
          title={`${pastQuestion.course_code}: ${pastQuestion.course_title}`}
          courseCode={pastQuestion.course_code}
          academicYear={pastQuestion.academic_year}
          department={pastQuestion.department}
          totalPagesCount={pastQuestion.total_pages || 1}
        />
      </main>

      <Footer />
    </div>
  );
}
