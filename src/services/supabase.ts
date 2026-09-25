import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL || 'https://mxlcoetldwduylpieyfg.supabase.co';
const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jmtHvlFLu3hKE-8ihABC6w_D8GAunZD';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder')
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export const BUCKETS = {
  VIDEOS: 'videos',
  AVATARS: 'avatars',
  IMAGES: 'images',
} as const;
