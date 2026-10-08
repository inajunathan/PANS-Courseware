import React from 'react';
import type { Metadata } from 'next';
import DocumentViewerWorkspace, { ViewerDocumentData } from '@/components/viewer/DocumentViewerWorkspace';

/**
 * Incremental Static Regeneration (ISR) configuration
 * Revalidates every 86400 seconds (24 hours).
 * This ensures thousands of static curriculum and lecture note views
 * remain cached globally at the Edge CDN.
 */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Interactive PDF Reader & Document Viewer | PANS Courseware',
  description: 'Study verified academic lecture notes, curriculum unit guides, and chemical SAR schemas in an interactive split-view reader with page bookmarks.',
};

const defaultDocument: ViewerDocumentData = {
  id: 'pch401-u1',
  title: 'Introduction to Structure-Activity Relationships (SAR) & Drug Design',
  courseCode: 'PCH 401',
  courseTitle: 'Pharmaceutical Chemistry: SAR & Drug Design',
  academicYear: '2025/2026',
  department: 'Dept. of Pharmaceutical Chemistry',
  lecturer: 'Prof. A. Adebayo, PhD, FPSN',
  module: 'Antimicrobial Drug Design',
  totalPages: 28,
  fileSize: '8.4 MB',
  pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
  returnUrl: '/courses/pch-401',
  chapterTitle: 'Structure-Activity Relationships (SAR)',
};

export default function DocumentViewerPage() {
  return <DocumentViewerWorkspace document={defaultDocument} />;
}
