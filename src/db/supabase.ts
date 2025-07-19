import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log(supabaseUrl + " hehehe " + supabaseAnonKey)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase environment variables not loaded.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
