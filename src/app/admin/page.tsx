import { requirePortalRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePortalRole(["owner", "manager", "worker"]);

  return (
    <main>
      <h1>بوابة الإدارة</h1>
      <p>المسار محمي وجاهز للبرمجة.</p>
    </main>
  );
}
