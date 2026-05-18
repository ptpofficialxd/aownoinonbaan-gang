import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { DashboardSummary } from "./types";

export function InsightsSection({
  dashboard,
}: {
  dashboard: DashboardSummary;
}) {
  const topMember = dashboard.topMembers[0] ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-[30px]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <Badge className="w-fit border-white/10 bg-white/6 text-zinc-300">
              ฮิตจังอะเรา
            </Badge>
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/20 bg-rose-400/10 text-rose-200 shadow-[0_0_20px_rgba(251,113,133,0.18)]">
              <Icon name="flame" className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {dashboard.categories.length ? (
              dashboard.categories.map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                    <span>{category.name}</span>
                    <span>{category.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/6">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500"
                      style={{
                        width: `${Math.max(
                          12,
                          (category.count /
                            Math.max(dashboard.categories[0]?.count ?? 1, 1)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">ยังไม่มีการอัปโหลด ณ ขณะนี้</p>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-[30px]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <Badge className="w-fit border-white/10 bg-white/6 text-zinc-300">
              จำนวนอัปโหลด
            </Badge>
            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/10 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.18)]">
              <Icon name="chart-up" className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {dashboard.topMembers.length ? (
              dashboard.topMembers.map((member, index) => (
                <div
                  key={member.username}
                  className="flex items-center justify-between rounded-[22px] border border-white/8 bg-black/18 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {index + 1}. @{member.username}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{member.name}</p>
                  </div>
                  <span className="text-sm text-cyan-200">
                    {member.uploads} ครั้ง
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">ยังไม่มีกิจกรรม ณ ขณะนี้</p>
            )}
          </div>

          <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              ขยันมากมั้ง (เยอะสุด)
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {topMember ? `@${topMember.username}` : ""}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {topMember
                ? `${topMember.name} · ${topMember.uploads} ครั้ง`
                : "อัปโหลดไฟล์เพื่อเริ่มกิจกรรม Leaderboard"}
            </p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
