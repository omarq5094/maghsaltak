import "server-only";

import { redirect } from "next/navigation";

import { getActor } from "./actor";
import type { AppRole } from "./roles";

export async function requirePortalRole(allowedRoles: readonly AppRole[]) {
  const actor = await getActor();

  if (!actor) {
    redirect("/?auth=required");
  }

  if (!allowedRoles.includes(actor.role)) {
    redirect("/?access=denied");
  }

  return actor;
}
