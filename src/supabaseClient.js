import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hesnqlggsncmkzpsndcq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc25xbGdnc25jbWt6cHNuZGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Mjg0OTcsImV4cCI6MjA5ODQwNDQ5N30.iRYGAuwemsgyaviu4cJSeedq0Ujh5ZQrklbe8oHELWw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
