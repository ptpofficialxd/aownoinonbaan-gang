import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/site/DashboardShell";
import { Hero } from "@/components/site/Hero";
import { sql } from "@/lib/db";
import {
  getGoogleDriveConnectionInfo,
  getGoogleDriveQuotaInfo,
} from "@/lib/drive";
import { getDashboardData } from "@/lib/media";
import { getServerSession } from "@/lib/session";

async function getMemberCount() {
  const rows = (await sql()`
    SELECT count(*)::int AS count
    FROM users
    WHERE is_active = true
  `) as Array<{ count: number }>;

  return rows[0]?.count ?? 0;
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const [dashboard, memberCount] = await Promise.all([
    getDashboardData(),
    getMemberCount(),
  ]);
  const [drive, driveQuota] = await Promise.all([
    getGoogleDriveConnectionInfo(),
    getGoogleDriveQuotaInfo(),
  ]);

  return (
    <div className="relative overflow-hidden pb-10">
      <div className="aurora pointer-events-none absolute inset-0 -z-20 opacity-90" />
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-35 [mask-image:linear-gradient(180deg,black_0%,black_82%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_right,rgba(56,189,248,0.1),transparent_28%),linear-gradient(180deg,rgba(7,10,16,0.18),rgba(7,10,16,0.58)_34%,rgba(7,10,16,0.5)_70%,rgba(7,10,16,0.12)_92%,rgba(7,10,16,0)_100%)]" />

      <Hero />
      <DashboardShell
        canManageDrive={session.role === "admin"}
        driveAccountEmail={drive.accountEmail}
        driveConnected={drive.connected}
        items={dashboard.items}
        remainingDriveBytes={driveQuota.remainingBytes}
        totalMembers={memberCount}
      />
    </div>
  );
}
