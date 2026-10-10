import "server-only";

import { createClient } from "@/lib/supabase/server";

import { type Actor, isAppRole } from "./roles";

type ProfileRow = {
  role: unknown;
  worker_id: number | null;
  courier_id: number | null;
};

export async function getActor(): Promise<Actor | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("role, worker_id, courier_id")
    .eq("user_id", user.id)
    .single();

  const profile = data as ProfileRow | null;

  if (error || !profile || !isAppRole(profile.role)) {
    return null;
  }

  return {
    userId: user.id,
    role: profile.role,
    workerId: profile.worker_id,
    courierId: profile.courier_id,
  };
}
