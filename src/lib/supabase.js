// supabase.js — the one browser client. Returns null when the backend isn't
// configured, so the app keeps working as a purely local tool (the free tier
// must never depend on the backend existing).
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // magic-link return
        },
      })
    : null;

export const backendEnabled = supabase !== null;
