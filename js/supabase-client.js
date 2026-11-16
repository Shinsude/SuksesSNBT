import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm";

const SUPABASE_URL = "https://yogtbxautvovqazmthwn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zhQSwrhr7a0giRluqobR_Q_pFs-dbk7";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
