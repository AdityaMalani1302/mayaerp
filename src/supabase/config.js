import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ibgqpaqrzokjcegtlrzb.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_5iEds4rRnV5QL1En4A0x3w_RooOfuYL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
