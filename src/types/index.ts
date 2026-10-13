export type AcademicLevel = '100' | '200' | '300' | '400' | '500' | '600';

export type Semester = 'First' | 'Second' | 'All';

export type Specialization = 
  | 'Core Professional'
  | 'Pharmaceutical Chemistry'
  | 'Pharmaceutics & Industrial Pharmacy'
  | 'Pharmacology & Toxicology'
  | 'Pharmacognosy & Drug Development'
  | 'Clinical Pharmacy & Pharmacy Practice'
  | 'Basic Sciences & Pre-Pharmacy';

export interface LectureUnit {
  id: string;
  unitNumber: number;
  title: string;
  lecturer: string;
  totalPages: number;
  fileSize: string;
  pdfUrl?: string;
  dateUploaded: string;
  isVerified: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  level: AcademicLevel;
  semester: Semester;
  units: number;
  specialization: Specialization;
  description: string;
  leadLecturer: string;
  department: string;
  pdfCount: number;
  pqCount: number;
  tutorialCount: number;
  pdfUrl?: string;
  pdf_storage_url?: string;
  lectureUnits: LectureUnit[];
}

export interface PastQuestion {
  id: string;
  courseCode: string;
  courseTitle: string;
  level: AcademicLevel;
  semester: Semester;
  session: string;
  examType: 'First Semester Examination' | 'Second Semester Examination' | 'Continuous Assessment Test' | 'Professional Board Mock';
  totalPages: number;
  fileSize: string;
  hasVerifiedSolutions: boolean;
  uploadedDate: string;
  examiners: string;
  downloadCount: number;
}

export interface TutorialVideo {
  id: string;
  title: string;
  courseCode: string;
  level: AcademicLevel;
  tutor: string;
  tutorRole: string;
  duration: string;
  views: number;
  thumbnail: string;
  category: string;
  notesAvailable: boolean;
}
