import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY mancanti. Compila .env.local.",
  );
}

export const SUPERADMIN_EMAIL = "admin@diario.internal";
const USERNAME_EMAIL_DOMAIN = "@diario.internal";

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}${USERNAME_EMAIL_DOMAIN}`;
}
