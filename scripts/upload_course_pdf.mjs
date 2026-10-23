/**
 * PANS Courseware - Course Syllabus & Material PDF Upload Utility
 * 
 * This script automates:
 * 1. Uploading a Course Handout / Syllabus PDF to Supabase Storage ('courses' bucket)
 * 2. Generating the permanent Public Storage URL
 * 3. Upserting the Course record in the 'courses' table with its 'pdf_storage_url'
 * 
 * Usage:
 *   node scripts/upload_course_pdf.mjs \
 *     --file="./public/sample-past-question.pdf" \
 *     --code="PCH 401" \
 *     --title="Pharmaceutical Chemistry: SAR & Drug Design" \
 *     --dept="Department of Pharmaceutical Chemistry"
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

async function uploadCoursePdf() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage:
  node scripts/upload_course_pdf.mjs [options]
  npm run upload:course -- [options]

Options:
  --file="path/to/syllabus.pdf"   Path to course syllabus or handout PDF
  --code="PCH 401"                Course code (e.g. PCG 501, PCH 401)
  --title="Course Title"          Full course title
  --dept="Department"             Department name
`);
    process.exit(0);
  }

  console.log('\n============================================================');
  console.log('🚀 PANS Courseware: Supabase Course PDF & Material Uploader');
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

  // Validate inputs
  const filePath = args.file || path.resolve(__dirname, '../public/sample-past-question.pdf');
  const courseCode = (args.code || 'PCH 401').trim();
  const courseTitle = (args.title || 'Pharmaceutical Chemistry: SAR & Drug Design').trim();
  const department = (args.dept || 'Department of Pharmaceutical Chemistry').trim();

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  const fileStats = fs.statSync(filePath);
  const fileSizeMb = (fileStats.size / (1024 * 1024)).toFixed(1);
  const fileSizeStr = `${fileSizeMb} MB`;
  const fileBuffer = fs.readFileSync(filePath);

  const cleanCourseCode = courseCode.replace(/\s+/g, '_').toUpperCase();
  const fileName = `${cleanCourseCode}_Syllabus_${Date.now()}.pdf`;
  const storagePath = `courses/${fileName}`;

  console.log(`\n📄 Local File: ${filePath} (${fileSizeStr})`);
  console.log(`📚 Course: [${courseCode}] ${courseTitle}`);
  console.log(`🏛️ Department: ${department}`);
  console.log(`☁️ Target Storage Bucket: 'courses' -> Path: '${storagePath}'`);

  try {
    // 1. Upload the file to the 'courses' bucket in Supabase Storage
    console.log('\n⏳ 1/2 Uploading PDF to Supabase Storage (courses bucket)...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('courses')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Obtain Public Storage URL
    const { data: urlData } = supabase.storage
      .from('courses')
      .getPublicUrl(storagePath);

    const publicPdfUrl = urlData.publicUrl;
    console.log(`✅ Uploaded successfully! Public URL:`);
    console.log(`   ${publicPdfUrl}`);

    // 3. Upsert Course record with pdf_storage_url in 'courses' table
    console.log('\n⏳ 2/2 Updating Course record in database with pdf_storage_url...');
    const { data: courseRow, error: courseError } = await supabase
      .from('courses')
      .upsert(
        {
          course_code: courseCode,
          course_title: courseTitle,
          department: department,
          pdf_storage_url: publicPdfUrl,
        },
        { onConflict: 'course_code' }
      )
      .select('id, course_code, course_title, pdf_storage_url')
      .single();

    if (courseError) {
      throw new Error(`Database upsert failed: ${courseError.message}`);
    }

    console.log('\n🎉 SUCCESS! Course syllabus PDF uploaded and linked.');
    console.log(`Course ID: ${courseRow.id}`);
    console.log(`Course Code: ${courseRow.course_code}`);
    console.log(`PDF Storage URL: ${courseRow.pdf_storage_url}`);
    console.log(`View Course at: http://localhost:3000/courses/${courseRow.course_code.toLowerCase().replace(/\s+/g, '-')}`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ Course upload pipeline failed:', err.message);
    console.log('============================================================\n');
    process.exit(1);
  }
}

uploadCoursePdf();
