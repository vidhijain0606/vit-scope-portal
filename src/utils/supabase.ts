import { createClient } from '@supabase/supabase-js'

// Hardcoded for reliability during development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqgbgfaxsgitfkclrsoy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ2JnZmF4c2dpdGZrY2xyc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMTg3MzgsImV4cCI6MjA4Mjg5NDczOH0.OZM4OmnmkqY1LGKhjCa5Y_XV898xQXIho3_NN-9tZDk';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
