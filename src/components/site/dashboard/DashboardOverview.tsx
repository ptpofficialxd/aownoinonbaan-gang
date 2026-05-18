import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatBytes, formatDate } from "@/lib/format";
import type { CloudHealthState, DashboardSummary } from "./types";
import { formatLatency, formatSyncLabel } from "./utils";

export function DashboardOverview({
  canConnectDrive,
  cloudHealth,
  dashboard,
  driveAccountEmail,
  driveConnected,
  remainingDriveBytes,
  totalMembers,
}: {
  canConnectDrive: boolean;
  cloudHealth: CloudHealthState;
  dashboard: DashboardSummary;
  driveAccountEmail: string | null;
  driveConnected: boolean;
  remainingDriveBytes: number | null;
  totalMembers: number;
}) {
  const isSystemReady = driveConnected && cloudHealth.online;
  const isCloudServerOnline = driveConnected && cloudHealth.online;
  const isCloudFailure =
    driveConnected &&
    !cloudHealth.online &&
    !cloudHealth.isPolling &&
    !cloudHealth.isPaused;

  return (
    /* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */
    <section
      id="home"
      className="scroll-mt-200 relative w-full min-w-0 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_35px_120px_-65px_rgba(34,211,238,0.45)] sm:p-7"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.12) 0, rgba(34, 211, 238, 0.06) 14%, transparent 28%), radial-gradient(circle at 0% 100%, rgba(52, 211, 153, 0.1) 0, rgba(52, 211, 153, 0.05) 12%, transparent 24%)",
        }}
      />

      <div className="relative space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
              แผงควบคุม
            </Badge>
            <Badge
              className={
                isSystemReady
                  ? "!border-emerald-300/25 !bg-emerald-400/14 !text-emerald-100"
                  : "!border-rose-300/25 !bg-rose-400/14 !text-rose-100"
              }
            >
              {isSystemReady ? "ระบบ: พร้อมใช้งาน" : "ระบบ: ไม่พร้อมใช้งาน"}
            </Badge>
          </div>

          <div>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Dashboard
              <span className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                ภาพรวม
              </span>
            </h2>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            description="สมาชิกในระบบ"
            icon="user"
            iconClassName="border-violet-300/20 bg-violet-400/10 text-violet-200 shadow-[0_0_20px_rgba(167,139,250,0.16)]"
            label="สมาชิก"
            value={totalMembers}
          />
          <MetricCard
            description="ไฟล์ในระบบ"
            icon="folder"
            iconClassName="border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.14)]"
            label="คลัง"
            value={dashboard.totalItems}
          />
          <MetricCard
            description="หมวดหมู่ในระบบ"
            icon="tag"
            iconClassName="border-orange-300/20 bg-orange-300/10 text-orange-200 shadow-[0_0_20px_rgba(251,146,60,0.14)]"
            label="หมวดหมู่"
            value={dashboard.categories.length}
          />
          <MetricCard
            description={driveConnected ? "ใน Cloud" : "ยังไม่ได้เชื่อมต่อกับ Cloud"}
            icon="file"
            iconClassName="border-zinc-300/15 bg-white/5 text-zinc-300 shadow-[0_0_18px_rgba(255,255,255,0.08)]"
            label="ขนาดไฟล์"
            value={formatBytes(dashboard.totalBytes)}
            xlOrder="xl:order-5"
          />
          <MetricCard
            description={driveConnected ? "ใน Cloud" : "ยังไม่ได้เชื่อมต่อกับ Cloud"}
            icon="cloud"
            iconClassName="border-slate-300/15 bg-sky-400/8 text-slate-200 shadow-[0_0_20px_rgba(125,211,252,0.12)]"
            label="พื้นที่ว่าง"
            value={
              driveConnected && remainingDriveBytes !== null
                ? formatBytes(remainingDriveBytes)
                : "--"
            }
            xlOrder="xl:order-6"
          />

          <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 xl:order-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  เวลาตอบสนอง
                </p>
                <p
                  className={`mt-3 text-3xl font-semibold ${
                    driveConnected && cloudHealth.online
                      ? "text-emerald-300"
                      : "text-white"
                  }`}
                >
                  {driveConnected && cloudHealth.online
                    ? formatLatency(cloudHealth.latencyMs)
                    : "--"}
                </p>
              </div>
              <span
                className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                  cloudHealth.online
                    ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                    : isCloudFailure
                      ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                      : "border-white/10 bg-white/5 text-zinc-500"
                }`}
              >
                <Icon name="bolt" className="h-3 w-3" />
              </span>
            </div>
            <p
              className={`mt-2 text-sm ${
                isCloudFailure ? "text-amber-200" : "text-zinc-300"
              }`}
            >
              {cloudHealth.isPaused
                ? "พักการ Sync"
                : cloudHealth.isPolling
                  ? "กำลัง Sync กับ Cloud..."
                  : cloudHealth.online
                    ? `Synced: ${formatSyncLabel(cloudHealth.checkedAt)}`
                    : driveConnected
                      ? "Cloud ตอบกลับไม่สำเร็จ"
                      : "ยังไม่ได้เชื่อมต่อกับ Cloud"}
            </p>
            {cloudHealth.online ? null : (
              <p className="mt-2 text-xs text-zinc-500">
                Synced: {formatSyncLabel(cloudHealth.checkedAt)}
              </p>
            )}
          </div>

          <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 md:col-span-3 xl:order-4 xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  สถานะ Cloud Server
                </p>
                <p
                  className={`mt-3 text-3xl font-semibold leading-tight ${
                    isCloudServerOnline ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {isCloudServerOnline ? "Online" : "Offline"}
                </p>
                <p className="mt-2 break-words text-sm text-zinc-400">
                  {driveConnected
                    ? `บัญชี: ${driveAccountEmail ?? "Connected successfully"}`
                    : canConnectDrive
                      ? ""
                      : "กำลังรอ Admin เชื่อมต่อ Cloud Server"}
                </p>
                {!driveConnected && canConnectDrive ? (
                  <a
                    href="/api/google-drive/oauth/start"
                    className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/12 px-4 text-sm font-medium text-emerald-50 transition-all hover:border-emerald-300/35 hover:bg-emerald-400/18"
                  >
                    <Icon name="google-drive" className="h-4 w-4" />
                    เชื่อมต่อ Google Drive
                  </a>
                ) : null}
              </div>
              <span
                className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                  isCloudServerOnline
                    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-[0_0_22px_rgba(74,222,128,0.18)]"
                    : "border-rose-300/20 bg-rose-400/10 text-rose-200 shadow-[0_0_20px_rgba(251,113,133,0.14)]"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isCloudServerOnline ? "bg-emerald-400" : "bg-rose-300"
                  }`}
                />
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-cyan-400/[0.06] p-4 md:col-span-3 xl:order-8 xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  อัปโหลดล่าสุด
                </p>
                <p
                  className={`mt-3 block max-w-[10ch] overflow-hidden text-ellipsis whitespace-nowrap text-3xl font-semibold leading-tight ${
                    dashboard.latestItem ? "text-pink-300" : "text-white"
                  }`}
                >
                  {dashboard.latestItem
                    ? dashboard.latestItem.fileName
                    : "ยังไม่มีไฟล์ล่าสุด"}
                </p>
                <p className="mt-2 break-words text-sm text-zinc-400">
                  {dashboard.latestItem
                    ? `@${dashboard.latestItem.uploaderUsername} · ${formatDate(
                        dashboard.latestItem.createdAt,
                      )}`
                    : "กดอัปโหลดเพื่อเริ่มอัปโหลดไฟล์ได้เลย"}
                </p>
              </div>
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-pink-300/20 bg-pink-400/10 text-pink-200 shadow-[0_0_22px_rgba(244,114,182,0.18)]">
                <Icon name="upload" className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  description,
  icon,
  iconClassName,
  label,
  value,
  xlOrder = "",
}: {
  description: string;
  icon: Parameters<typeof Icon>[0]["name"];
  iconClassName: string;
  label: string;
  value: number | string;
  xlOrder?: string;
}) {
  return (
    <div
      className={`rounded-[26px] border border-white/10 bg-black/20 p-4 ${xlOrder}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <span
          className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border ${iconClassName}`}
        >
          <Icon name={icon} className="h-3 w-3" />
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </div>
  );
}
