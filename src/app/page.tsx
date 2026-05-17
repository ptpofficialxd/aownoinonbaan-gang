import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/site/DashboardShell";
import { Hero } from "@/components/site/Hero";
import { sql } from "@/lib/db";
import { getGoogleDriveConnectionInfo, getGoogleDriveQuotaInfo } from "@/lib/drive";
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
    <div className="pb-10">
      <Hero />
      <DashboardShell
        canManageDrive={session.role === "admin"}
        driveAccountEmail={drive.accountEmail}
        driveConnected={drive.connected}
        items={dashboard.items}
        remainingDriveBytes={driveQuota.remainingBytes}
        totalMembers={memberCount}
        totalBytes={dashboard.totalBytes}
        totalItems={dashboard.totalItems}
        categories={dashboard.categories}
        topMembers={dashboard.topMembers}
      />
    </div>
  );
}
