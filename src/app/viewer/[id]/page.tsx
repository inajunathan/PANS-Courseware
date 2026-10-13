import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DocumentViewerWorkspace, { ViewerDocumentData } from '@/components/viewer/DocumentViewerWorkspace';
import { coursesData } from '@/data/coursesData';
import { fetchLectureUnitById } from '@/lib/coursesService';
import { FileText, ArrowLeft } from 'lucide-react';

/**
 * Incremental Static Regeneration (ISR) configuration
 * Revalidates every 86400 seconds (24 hours).
 * This ensures thousands of lecture notes, unit syllabus PDFs, and official course
 * handouts are statically cached at Vercel's Edge CDN.
 */
export const revalidate = 86400;

/**
 * Dynamic params set to true: any newly uploaded PDF unit record
 * not pre-rendered at build time will be generated on-demand and cached for 24 hours.
 */
export const dynamicParams = true;

/**
 * Pre-generate static routes at build time for all curriculum lecture unit PDFs.
 */
export async function generateStaticParams() {
  const ids: { id: string }[] = [];
  
  for (const c of coursesData) {
    for (const u of c.lectureUnits) {
      ids.push({ id: u.id });
    }
  }

  return ids;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Dynamic SEO metadata generation for each individual PDF viewer route
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await fetchLectureUnitById(id);

  if (!match) {
    return {
      title: 'Lecture PDF Not Found | PANS Courseware',
      description: 'The requested academic PDF document could not be loaded.',
    };
  }

  const { unit, course } = match;
  const title = `${unit.title} (${course.code} Unit ${unit.unitNumber}) | PANS Courseware`;
  const description = `Interactive PDF lecture notes and study breakdown for ${unit.title} by ${unit.lecturer} (${course.code}).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
}

export default async function IndividualPdfViewerPage({ params }: PageProps) {
  const { id } = await params;
  const match = await fetchLectureUnitById(id);

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
        <Header />
        <main className="flex-1 pt-28 flex flex-col items-center justify-center p-4">
          <FileText className="w-12 h-12 text-slate-400 mb-3" />
          <h2 className="font-['Montserrat',sans-serif] text-xl font-bold text-slate-800 mb-2">
            Lecture PDF Not Found
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            The requested course lecture handout could not be located in our repository.
          </p>
          <Link
            href="/courses"
            className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6B21A8] transition-colors"
          >
            Return to Course Hub
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { unit, course } = match;
  const publicPdfUrl = unit.pdfUrl || course.pdf_storage_url || '/sample-past-question.pdf';

  const doc: ViewerDocumentData = {
    id: unit.id,
    title: unit.title,
    courseCode: course.code,
    courseTitle: course.title,
    academicYear: '2025/2026',
    department: course.department,
    lecturer: unit.lecturer,
    module: `Unit ${unit.unitNumber} PDF & Slides Module`,
    totalPages: unit.totalPages || 28,
    fileSize: unit.fileSize || '8.4 MB',
    pdfUrl: publicPdfUrl,
    returnUrl: `/courses/${course.code.toLowerCase().replace(/\s+/g, '-')}`,
    chapterTitle: `Unit ${unit.unitNumber}: ${unit.title}`,
    leadParagraph: `This official course document covers the learning objectives and slides for ${course.code} Unit ${unit.unitNumber}, supervised by ${unit.lecturer}. It details core principles, mechanisms, pharmacophore mappings, and exam criteria.`,
  };

  return <DocumentViewerWorkspace document={doc} />;
}
