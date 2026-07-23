import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your .env.local file.");
}

// Lazy initialization: il client viene creato solo quando le credenziali sono disponibili
let _supabase = null;

export const supabase = new Proxy({}, {
  get(_, prop) {
    if (!_supabase) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured.');
      }
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase[prop];
  }
});

