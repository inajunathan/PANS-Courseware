import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CourseDetailsClient from '@/components/courses/CourseDetailsClient';
import { coursesData } from '@/data/coursesData';
import { pastQuestionsData } from '@/data/pastQuestionsData';
import { tutorialsData } from '@/data/tutorialsData';
import { ArrowLeft, BookOpen } from 'lucide-react';

/**
 * Incremental Static Regeneration (ISR) configuration
 * Revalidates every 86400 seconds (24 hours).
 * This ensures thousands of course syllabus variations and curriculum guides
 * are statically cached on Vercel's Edge/Hobby tier, eliminating continuous
 * database queries and providing instant loads for students.
 */
export const revalidate = 86400;

/**
 * Dynamic params set to true: pages not pre-rendered at build time
 * will be generated on-demand and cached statically for subsequent requests.
 */
export const dynamicParams = true;

/**
 * Pre-generate static routes at build time for existing courses.
 */
export async function generateStaticParams() {
  return coursesData.map((c) => ({
    courseCode: c.id,
  }));
}

interface PageProps {
  params: Promise<{
    courseCode: string;
  }>;
}

/**
 * Dynamic SEO metadata generation for each course syllabus page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseCode } = await params;
  const rawCode = (courseCode || '').toLowerCase();

  const course = coursesData.find(
    (c) =>
      c.id.toLowerCase() === rawCode ||
      c.code.toLowerCase().replace(/\s+/g, '-') === rawCode
  );

  if (!course) {
    return {
      title: 'Course Not Found | PANS Courseware',
      description: 'The requested pharmacy course syllabus could not be found.',
    };
  }

  const title = `${course.code}: ${course.title} (${course.level}L) | PANS Courseware`;
  const description = `Access verified syllabus, curriculum lecture units, past exam questions, and video tutorials for ${course.code} - ${course.title} at Faculty of Pharmacy.`;

  return {
    title,
    description,
    openGraph: {
      title: `${course.code}: ${course.title}`,
      description,
      type: 'website',
    },
  };
}

export default async function CourseDetailsPage({ params }: PageProps) {
  const { courseCode } = await params;
  const rawCode = (courseCode || '').toLowerCase();

  const course = coursesData.find(
    (c) =>
      c.id.toLowerCase() === rawCode ||
      c.code.toLowerCase().replace(/\s+/g, '-') === rawCode
  );

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
        <Header />
        <main className="flex-1 pt-28 flex flex-col items-center justify-center p-4">
          <BookOpen className="w-12 h-12 text-slate-400 mb-3" />
          <h2 className="font-['Montserrat',sans-serif] text-xl font-bold text-slate-800 mb-2">
            Course Not Found
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            The requested course record could not be loaded.
          </p>
          <Link
            href="/courses"
            className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6B21A8] transition-colors"
          >
            Return to Course Library
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedPQs = pastQuestionsData.filter((pq) => pq.courseCode === course.code);
  const relatedTutorials = tutorialsData.filter((t) => t.courseCode === course.code);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />
      <CourseDetailsClient
        course={course}
        relatedPQs={relatedPQs}
        relatedTutorials={relatedTutorials}
      />
      <Footer />
    </div>
  );
}
