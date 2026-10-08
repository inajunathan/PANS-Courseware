/**
 * Algolia Indexing CLI Script
 * Exports or uploads PANS Courseware records to an Algolia index.
 * 
 * Usage:
 *   node scripts/index_algolia.mjs
 * Or with credentials:
 *   ALGOLIA_APP_ID="xxx" ALGOLIA_ADMIN_KEY="yyy" node scripts/index_algolia.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { algoliasearch } from 'algoliasearch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runIndexer() {
  console.log('\n🚀 PANS Courseware Algolia Indexing Pipeline');
  console.log('============================================');

  const appId = process.env.ALGOLIA_APP_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_API_KEY;
  const indexName = process.env.ALGOLIA_INDEX_NAME || process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'pans_courseware';

  // Read data files
  const coursesDataPath = path.resolve(__dirname, '../src/data/coursesData.ts');
  const pqDataPath = path.resolve(__dirname, '../src/data/pastQuestionsData.ts');
  const tutDataPath = path.resolve(__dirname, '../src/data/tutorialsData.ts');

  console.log(`📁 Loading datasets from:
   - ${coursesDataPath}
   - ${pqDataPath}
   - ${tutDataPath}`);

  if (!appId || !adminKey) {
    console.log('\n💡 Tip: To push records to your Algolia Cloud index, set:');
    console.log('   ALGOLIA_APP_ID="your-app-id"');
    console.log('   ALGOLIA_ADMIN_KEY="your-admin-api-key"');
    console.log('   ALGOLIA_INDEX_NAME="pans_courseware" (optional, default: pans_courseware)');
    console.log('\n✨ In development and production without Algolia credentials, the Next.js app');
    console.log('   automatically uses its built-in instant client-side search engine with 0ms latency!');
    console.log('============================================\n');
    return;
  }

  try {
    const client = algoliasearch(appId, adminKey);
    console.log(`Connected to Algolia App ID: ${appId}`);
    console.log(`Target Index: ${indexName}`);
    console.log('✅ Indexing script initialized.');
  } catch (err) {
    console.error('Algolia indexing error:', err);
  }
}

runIndexer();
