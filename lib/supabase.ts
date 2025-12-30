
import { createClient } from '@supabase/supabase-js';

/**
 * PENTING:
 * Ganti URL dan KEY di bawah ini dengan kredensial dari dashboard Supabase Anda.
 * Temukan di: Project Settings -> API
 */
const supabaseUrl = 'https://djhblvyjrhzkjfurzony.supabase.co';
const supabaseAnonKey = 'sb_publishable_0aznTYJJTHOhfrxwAoFyig_MTu7GZau';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
