import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const sqlPath = path.join(__dirname, 'migrations', '02_relational_courses_past_questions_tutorials.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log('\n------------------------------------------------------------');
    console.log('📌 NOTE: DATABASE_URL not detected in environment.');
    console.log('You can execute this migration in two easy ways:');
    console.log('1. Copy the contents of:');
    console.log('   supabase/migrations/02_relational_courses_past_questions_tutorials.sql');
    console.log('   and paste it directly into your Supabase Dashboard -> SQL Editor.');
    console.log('2. Or run: DATABASE_URL="postgresql://..." node supabase/run_migration.mjs');
    console.log('------------------------------------------------------------\n');
    return;
  }

  try {
    // If pg is installed or user passes connection
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: dbUrl });
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');
    console.log('Applying migration...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!');
    await client.end();
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

run();
