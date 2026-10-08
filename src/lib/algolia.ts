import { liteClient } from 'algoliasearch/lite';

/**
 * Algolia Client Configuration
 * If environment variables are provided, connects to Algolia InstantSearch index.
 * Otherwise, falls back gracefully to our fast in-memory client-side indexing engine.
 */
export const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
export const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '';
export const ALGOLIA_INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'pans_courseware';

export const isAlgoliaConfigured = Boolean(
  ALGOLIA_APP_ID && 
  ALGOLIA_SEARCH_KEY && 
  ALGOLIA_APP_ID !== 'your-algolia-app-id' &&
  ALGOLIA_SEARCH_KEY !== 'your-algolia-search-api-key'
);

export const algoliaClient = isAlgoliaConfigured
  ? liteClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)
  : null;
