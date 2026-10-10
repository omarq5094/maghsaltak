import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv, getSupabaseSecretKey } from "./env";

export function createAdminClient() {
  const { url } = getPublicSupabaseEnv();

  return createClient(url, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
