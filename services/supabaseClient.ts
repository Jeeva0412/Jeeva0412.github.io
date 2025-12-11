import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// 🛑 CONFIGURATION REQUIRED
// Paste your Supabase Project URL and Anon Key below
// ------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mpsspgojvgzthmrajujs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc3NwZ29qdmd6dGhtcmFqdWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjQ2NzIsImV4cCI6MjA4MTA0MDY3Mn0.SODsjMXzWfxMztGzJcpbfykpwiYyiLU8YfGEyqYIMjM';

// ------------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const isSupabaseConfigured = () => {
    return (
        SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && 
        SUPABASE_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
        SUPABASE_URL !== '' &&
        SUPABASE_KEY !== ''
    );
};