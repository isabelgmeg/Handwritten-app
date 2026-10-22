import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Null when the env vars are missing (fresh clone, preview deploy without them),
// so the app still starts; callers degrade instead of crashing on import.
export const supabase = url && key ? createClient(url, key) : null;
