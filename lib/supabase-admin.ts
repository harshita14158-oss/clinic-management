import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client.
// This uses the service role key, bypasses RLS, and must never be imported into
// client components or exposed to the browser. Keep RLS enabled with no public
// anon policies on medical/clinic tables; this app does not use the anon key.
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : new Proxy({}, {
      get() {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      }
    }) as ReturnType<typeof createClient>;
