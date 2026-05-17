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
    <div className="relative w-full max-w-full overflow-x-hidden overflow-y-visible pb-10">
      <div className="aurora pointer-events-none absolute inset-0 -z-20 opacity-90" />
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-28 [mask-image:linear-gradient(180deg,black_0%,black_72%,rgba(0,0,0,0.82)_86%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_right,rgba(56,189,248,0.11),transparent_27%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.06),transparent_26%),linear-gradient(180deg,rgba(7,10,16,0.16),rgba(7,10,16,0.56)_28%,rgba(7,10,16,0.48)_58%,rgba(7,10,16,0.2)_82%,rgba(7,10,16,0.05)_94%,rgba(7,10,16,0)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(7,10,16,0),rgba(7,10,16,0.36)_48%,rgba(7,10,16,0.72)_100%)]" />

      <Hero />
      <DashboardShell
        canConnectDrive={session.role === "admin"}
        canManageDrive={true}
        driveAccountEmail={drive.accountEmail}
        driveConnected={drive.connected}
        items={dashboard.items}
        remainingDriveBytes={driveQuota.remainingBytes}
        totalMembers={memberCount}
      />
    </div>
  );
}
