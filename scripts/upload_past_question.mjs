/**
 * PANS Courseware - Past Question & PDF Upload Utility
 * 
 * This script automates:
 * 1. Uploading a PDF file to Supabase Storage ('past-questions' bucket)
 * 2. Generating the permanent Public Storage URL
 * 3. Inserting or linking the Course in the 'courses' table
 * 4. Inserting the Past Question record in the 'past_questions' table
 * 
 * Usage:
 *   node scripts/upload_past_question.mjs \
 *     --file="./public/sample-past-question.pdf" \
 *     --code="PCH 401" \
 *     --title="Pharmaceutical Chemistry: SAR & Drug Design" \
 *     --dept="Department of Pharmaceutical Chemistry" \
 *     --year="2024/2025" \
 *     --semester="First" \
 *     --examType="First Semester Examination" \
 *     --pages=8
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse simple .env or .env.local file if not already in process.env
function loadEnv() {
  const rootDir = path.resolve(__dirname, '..');
  const envFiles = ['.env.local', '.env'];

  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Prefer service role key for admin upload operations to bypass RLS, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Simple CLI Argument Parser
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      args[key] = rest.join('=');
    }
  }
  return args;
}

async function uploadPastQuestion() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage:
  node scripts/upload_past_question.mjs [options]
  npm run upload:pq -- [options]

Options:
  --file="path/to/exam.pdf"       Path to past question PDF (required)
  --code="PCH 401"                Course code (e.g. PCG 501, PCH 401)
  --title="Course Title"          Full course title
  --dept="Department"             Department name
  --year="2024/2025"              Academic session (e.g. 2023/2024)
  --semester="First"              "First" or "Second"
  --examType="Degree Exam"        Exam type (e.g. First Semester Examination)
  --pages=8                       Total pages
`);
    process.exit(0);
  }

  console.log('\n============================================================');
  console.log('🚀 PANS Courseware: Supabase PDF & Past Question Uploader');
  console.log('============================================================');

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    console.error('\n❌ Missing Supabase credentials in .env.local or environment variables!');
    console.error('Please configure:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.log('============================================================\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const args = parseArgs();

  // Validate or set default inputs
  const filePath = args.file || path.resolve(__dirname, '../public/sample-past-question.pdf');
  const courseCode = (args.code || 'PCH 401').trim();
  const courseTitle = (args.title || 'Pharmaceutical Chemistry: SAR & Drug Design').trim();
  const department = (args.dept || 'Department of Pharmaceutical Chemistry').trim();
  const academicYear = (args.year || '2024/2025').trim();
  const semester = (args.semester || 'First').trim();
  const examType = (args.examType || 'First Semester Examination').trim();
  const totalPages = parseInt(args.pages || '8', 10);
  const examiners = (args.examiners || 'Departmental Examination Board').trim();

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  const fileStats = fs.statSync(filePath);
  const fileSizeMb = (fileStats.size / (1024 * 1024)).toFixed(1);
  const fileSizeStr = `${fileSizeMb} MB`;
  const fileBuffer = fs.readFileSync(filePath);

  const cleanCourseCode = courseCode.replace(/\s+/g, '_').toUpperCase();
  const cleanYear = academicYear.replace(/[\/\s]+/g, '-');
  const fileName = `${cleanCourseCode}_${cleanYear}_${semester}_${Date.now()}.pdf`;
  const storagePath = `past-questions/${fileName}`;

  console.log(`\n📄 Local File: ${filePath} (${fileSizeStr})`);
  console.log(`📚 Course: [${courseCode}] ${courseTitle}`);
  console.log(`📅 Academic Year: ${academicYear} | Semester: ${semester}`);
  console.log(`☁️ Target Storage Bucket: 'past-questions' -> Path: '${storagePath}'`);

  try {
    // 1. Upload the file to Supabase Storage
    console.log('\n⏳ 1/3 Uploading PDF to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('past-questions')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Obtain Public Storage URL
    const { data: urlData } = supabase.storage
      .from('past-questions')
      .getPublicUrl(storagePath);

    const publicPdfUrl = urlData.publicUrl;
    console.log(`✅ Uploaded successfully! Public URL:`);
    console.log(`   ${publicPdfUrl}`);

    // 3. Upsert Course record in 'courses' table (if courses table exists)
    console.log('\n⏳ 2/3 Linking Course in database...');
    let courseId = null;

    try {
      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .upsert(
          {
            course_code: courseCode,
            course_title: courseTitle,
            department: department,
          },
          { onConflict: 'course_code' }
        )
        .select('id')
        .single();

      if (!courseError && courseRow) {
        courseId = courseRow.id;
        console.log(`✅ Course linked! Course ID: ${courseId}`);
      }
    } catch {
      // If courses table doesn't exist, proceed with flat past_questions
    }

    // 4. Insert Past Question record in 'past_questions' table
    console.log('\n⏳ 3/3 Storing Past Question metadata record...');
    const pqRecord = {
      course_code: courseCode,
      course_title: courseTitle,
      department: department,
      academic_year: academicYear,
      semester: semester,
      exam_type: examType,
      pdf_storage_url: publicPdfUrl,
      has_verified_solutions: true,
      total_pages: totalPages,
      file_size: fileSizeStr,
      examiners: examiners,
      download_count: 0,
      ...(courseId ? { course_id: courseId } : {}),
    };

    const { data: pqData, error: pqError } = await supabase
      .from('past_questions')
      .insert([pqRecord])
      .select()
      .single();

    if (pqError) {
      throw new Error(`Database insert failed: ${pqError.message}`);
    }

    console.log('\n🎉 SUCCESS! Past question uploaded and recorded.');
    console.log(`Record ID: ${pqData.id}`);
    console.log(`View live at: http://localhost:3000/past-questions/${pqData.id}`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ Upload pipeline failed:', err.message);
    console.log('============================================================\n');
    process.exit(1);
  }
}

uploadPastQuestion();
