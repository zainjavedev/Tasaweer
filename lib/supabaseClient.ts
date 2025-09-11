import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client. Requires env to be set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy object to avoid crashes if not configured; callers should guard.
    return null as any;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
})();

