import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NUXT_PUBLIC_SUPABASE_URL || "https://<project-id>.supabase.co";
const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY || "<anon_key>";

export const supabase = createClient(supabaseUrl, supabaseKey);
