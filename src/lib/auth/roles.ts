export const APP_ROLES = ["owner", "manager", "worker", "courier", "customer"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export type Actor = {
  userId: string;
  role: AppRole;
  workerId: number | null;
  courierId: number | null;
};
