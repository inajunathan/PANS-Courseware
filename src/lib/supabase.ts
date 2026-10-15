import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Fallback mock/safe client if keys have not been populated yet
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : (createClient('https://placeholder.supabase.co', 'placeholder-anon-key') as SupabaseClient);

// Elevated admin client for server-side API routes if service role key is provided
export const supabaseAdmin: SupabaseClient = (isSupabaseConfigured && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })
  : supabase;

export function getSupabaseConfigStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    urlConfigured: Boolean(supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseUrl !== 'https://your-project.supabase.co'),
    anonKeyConfigured: Boolean(supabaseAnonKey && supabaseAnonKey !== 'placeholder-anon-key' && supabaseAnonKey.length > 20),
    serviceKeyConfigured: Boolean(supabaseServiceKey && supabaseServiceKey.length > 20),
    projectHost: supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('/')[0] : null,
  };
}
