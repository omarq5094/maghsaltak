export type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { url, publishableKey };
}

export function getSupabaseSecretKey(): string {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured.");
  }

  return secretKey;
}
