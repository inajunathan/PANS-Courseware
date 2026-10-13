/**
 * PANS Courseware - Upload Lecture Slides & Unit PDFs Utility
 * 
 * This script automates:
 * 1. Uploading a slide deck/unit PDF into the Supabase Storage 'courses' bucket
 * 2. Generating the permanent Public Storage URL
 * 3. Linking the slide to the course in the 'course_slides' table
 * 
 * Usage:
 *   node scripts/upload_slide.mjs \
 *     --file="./public/sample-past-question.pdf" \
 *     --code="PCH 401" \
 *     --unit=1 \
 *     --title="Introduction to SAR & Drug Design" \
 *     --lecturer="Prof. A. Adebayo" \
 *     --pages=28 \
 *     --level="400"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

async function uploadSlide() {
  console.log('\n============================================================');
  console.log('🚀 PANS Courseware: Supabase PDF & Slide Deck Uploader');
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

  const filePath = args.file || path.resolve(__dirname, '../public/sample-past-question.pdf');
  const courseCode = (args.code || 'PCH 401').trim();
  const unitNumber = parseInt(args.unit || '1', 10);
  const title = (args.title || `Unit ${unitNumber} Lecture Slides`).trim();
  const lecturer = (args.lecturer || 'Faculty Lecturer').trim();
  const totalPages = parseInt(args.pages || '28', 10);
  const level = (args.level || '400').trim();

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  const fileStats = fs.statSync(filePath);
  const fileSizeMb = (fileStats.size / (1024 * 1024)).toFixed(1);
  const fileSizeStr = `${fileSizeMb} MB`;
  const fileBuffer = fs.readFileSync(filePath);

  const cleanCourseCode = courseCode.replace(/\s+/g, '_').toUpperCase();
  const cleanTitleSlug = title.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 30);
  const paddedUnit = String(unitNumber).padStart(2, '0');
  const fileName = `Unit_${paddedUnit}_${cleanTitleSlug}_${Date.now()}.pdf`;
  const storagePath = `${level}L/${cleanCourseCode}/units/${fileName}`;

  console.log(`\n📄 Local File: ${filePath} (${fileSizeStr})`);
  console.log(`📚 Course: [${courseCode}]`);
  console.log(`📑 Unit: ${unitNumber} - ${title} (by ${lecturer})`);
  console.log(`☁️ Storage Bucket: 'courses' -> Path: '${storagePath}'`);

  try {
    // 1. Upload to 'courses' bucket
    console.log('\n⏳ 1/3 Uploading Slide PDF to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('courses')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
      .from('courses')
      .getPublicUrl(storagePath);

    const publicPdfUrl = urlData.publicUrl;
    console.log(`✅ Uploaded successfully! Public URL:`);
    console.log(`   ${publicPdfUrl}`);

    // 3. Find or ensure course exists in 'courses' table
    console.log('\n⏳ 2/3 Finding Course in database...');
    let { data: courseRow } = await supabase
      .from('courses')
      .select('id')
      .ilike('course_code', courseCode)
      .maybeSingle();

    if (!courseRow) {
      const { data: newCourse, error: createError } = await supabase
        .from('courses')
        .insert({
          course_code: courseCode,
          course_title: courseCode,
          department: 'College of Pharmacy',
        })
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Failed to create course: ${createError.message}`);
      }
      courseRow = newCourse;
    }

    const courseId = courseRow.id;

    // 4. Insert row into 'course_slides' table
    console.log('\n⏳ 3/3 Storing Slide record in course_slides table...');
    const { data: slideData, error: slideError } = await supabase
      .from('course_slides')
      .insert({
        course_id: courseId,
        unit_number: unitNumber,
        title: title,
        lecturer: lecturer,
        pdf_url: publicPdfUrl,
        total_pages: totalPages,
        file_size: fileSizeStr,
        is_verified: true,
      })
      .select()
      .single();

    if (slideError) {
      throw new Error(`Failed to insert into course_slides: ${slideError.message}`);
    }

    console.log('\n🎉 SUCCESS! Slide deck uploaded and recorded.');
    console.log(`Slide ID: ${slideData.id}`);
    console.log(`Course: ${courseCode} (Unit ${unitNumber})`);
    console.log(`View live at: http://localhost:3000/courses/${courseCode.toLowerCase().replace(/\s+/g, '-')}`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ Upload failed:', err.message);
    console.log('============================================================\n');
    process.exit(1);
  }
}

uploadSlide();
