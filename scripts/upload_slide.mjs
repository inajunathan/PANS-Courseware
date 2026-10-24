/**
 * PANS Courseware - Upload Lecture Slides & Unit PDFs Utility
 * 
 * Automates:
 * 1. Uploading a slide deck/unit PDF into the Supabase Storage 'courses' bucket
 * 2. Generating the permanent Public Storage URL
 * 3. Linking the slide to the course in the 'course_slides' table
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill WebSocket for Node.js < 22 to prevent @supabase/realtime-js throw
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {};
}

import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CLI Argument Parser
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx).trim();
        const val = arg.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        args[key] = val;
      } else {
        args[arg.slice(2).trim()] = true;
      }
    }
  }
  return args;
}

// Helper to parse simple .env or .env.local file
function loadEnv() {
  const possibleDirs = [
    path.resolve(__dirname, '..'),           // pans-courseware
    path.resolve(__dirname, '../..'),        // workspace root
    process.cwd()
  ];
  const envFiles = ['.env.local', '.env'];

  for (const dir of possibleDirs) {
    for (const file of envFiles) {
      const fullPath = path.join(dir, file);
      if (fs.existsSync(fullPath)) {
        try {
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
        } catch {
          // ignore read error
        }
      }
    }
  }
}

loadEnv();

async function uploadSlide() {
  const args = parseArgs();

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage:
  node scripts/upload_slide.mjs --file="path/to/file.pdf" --code="PCG 501" --title="Lecture 1"
  npm run upload:slide -- --file="path/to/file.pdf" --code="PCG 501" --title="Lecture 1"

Options:
  --file="path/to/file.pdf"       (Required) Path to local PDF, PPTX, DOCX, or image
  --code="PCG 501"                (Required) Course code (e.g. PCG 501, PCH 401)
  --title="Lecture Title"         (Required) Title of lecture notes / slides
  --pages=20                      (Optional) Number of pages / slides (default: 20)
  --level="500"                   (Optional) Class level (100, 200, 300, 400, 500)
  --key="your-supabase-key"       (Optional) Supabase service_role or anon API key
  --url="your-supabase-url"       (Optional) Supabase project URL
`);
    process.exit(0);
  }

  console.log('\n============================================================');
  console.log('🚀 PANS Courseware: Supabase PDF & Slide Deck Uploader');
  console.log('============================================================');

  // Supabase credentials resolution
  const supabaseUrl = 
    args.url || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    'https://yvbyqrmfdlpynensanbc.supabase.co';

  const supabaseKey = 
    args.key || 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY;

  if (!supabaseKey) {
    console.error('\n❌ Missing Supabase API Key!');
    console.error('To fix this, you have two quick options:');
    console.error('\nOption 1: Pass your key directly with --key in the command:');
    console.error('  node scripts/upload_slide.mjs --key="YOUR_KEY" --file="slide.pdf" --code="PCG 501" --title="Topic"');
    console.error('\nOption 2: Create a .env.local file in the pans-courseware folder with:');
    console.error(`  NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
    console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n🔑 You can copy your keys from your Supabase Dashboard:');
    console.error('  https://supabase.com/dashboard/project/yvbyqrmfdlpynensanbc/settings/api');
    console.log('============================================================\n');
    process.exit(1);
  }

  // Validate file
  const rawFile = args.file;
  if (!rawFile) {
    console.error('\n❌ Error: Please specify the file to upload using --file="path/to/file.pdf"');
    console.log('============================================================\n');
    process.exit(1);
  }

  let filePath = path.isAbsolute(rawFile) ? rawFile : path.resolve(process.cwd(), rawFile);
  if (!fs.existsSync(filePath)) {
    // Try resolving relative to script root
    const altPath = path.resolve(__dirname, '..', rawFile);
    if (fs.existsSync(altPath)) {
      filePath = altPath;
    } else {
      console.error(`\n❌ Error: File not found at: ${filePath}`);
      console.error(`Please check that the file exists and that the path is correct.`);
      console.log('============================================================\n');
      process.exit(1);
    }
  }

  const courseCode = (args.code || 'PCG 501').trim();
  const title = (args.title || path.basename(filePath, path.extname(filePath))).trim();
  const totalPages = parseInt(args.pages || '20', 10);
  const level = (args.level || '500').trim();

  const fileStats = fs.statSync(filePath);
  const fileSizeMb = (fileStats.size / (1024 * 1024)).toFixed(1);
  const fileSizeStr = `${fileSizeMb} MB`;
  const fileBuffer = fs.readFileSync(filePath);

  const cleanCourseCode = courseCode.replace(/\s+/g, '_').toUpperCase();
  const cleanTitleSlug = title.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 30);
  const ext = path.extname(filePath).toLowerCase() || '.pdf';
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  const mimeType = mimeMap[ext] || 'application/octet-stream';

  const fileName = `${cleanTitleSlug}_${Date.now()}${ext}`;
  const storagePath = `${level}L/${cleanCourseCode}/slides/${fileName}`;

  console.log(`\n📄 Local File: ${filePath} (${fileSizeStr}) [${ext.toUpperCase()}]`);
  console.log(`📚 Course: [${courseCode}]`);
  console.log(`📑 Title: ${title}`);
  console.log(`☁️ Supabase Project: ${supabaseUrl}`);
  console.log(`☁️ Storage Bucket: 'courses' -> '${storagePath}'`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Upload to 'courses' bucket
    console.log(`\n⏳ 1/3 Uploading File to Supabase Storage...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('courses')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
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
    console.log('\n⏳ 2/3 Checking Course in database...');
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
        title: title,
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

    console.log('\n🎉 SUCCESS! Slide deck uploaded and recorded in database.');
    console.log(`Slide ID: ${slideData.id}`);
    console.log(`Course: ${courseCode}`);
    console.log(`Preview online at: https://pans-courseware.vercel.app/courses/${courseCode.toLowerCase().replace(/\s+/g, '-')}`);
    console.log(`Direct viewer: https://pans-courseware.vercel.app/viewer/${slideData.id}`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ Upload failed:', err.message);
    console.log('============================================================\n');
    process.exit(1);
  }
}

uploadSlide();
