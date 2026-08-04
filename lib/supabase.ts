import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the secret key, so this file must NEVER
// be imported into a client component ("use client"). Only server
// components and API routes may import it.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});