"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaItem } from "@/lib/media";
import { UploadForm } from "./UploadForm";

type CategorySummary = {
  name: string;
  count: number;
};

type MemberSummary = {
  name: string;
  uploads: number;
};

function mediaIconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "folder";
}

function isPreviewableImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function DashboardShell({
  canManageDrive,
  driveAccountEmail,
  driveConnected,
  items,
  remainingDriveBytes,
  totalMembers,
  totalBytes,
  totalItems,
  categories,
  topMembers,
}: {
  canManageDrive: boolean;
  driveAccountEmail: string | null;
  driveConnected: boolean;
  items: MediaItem[];
  remainingDriveBytes: number | null;
  totalMembers: number;
  totalBytes: number;
  totalItems: number;
  categories: CategorySummary[];
  topMembers: MemberSummary[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const filteredItems = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const haystack =
        `${item.fileName} ${item.description ?? ""} ${item.uploaderName}`.toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearch, items]);

  const latestItem = items[0] ?? null;
  const categoryLeader = categories[0] ?? null;
  const topMember = topMembers[0] ?? null;

  async function handleDelete(item: MediaItem) {
    if (!canManageDrive || deletingId) return;

    const ok = window.confirm(
      `ลบไฟล์ "${item.fileName}" ออกจาก Google Drive และระบบเลยไหม?`,
    );
    if (!ok) return;

    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: "DELETE",
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      window.location.reload();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "ลบไฟล์ไม่สำเร็จ",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-7 px-6 pb-16">
        {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
        <section
          id="overview"
          className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_35px_120px_-65px_rgba(34,211,238,0.45)] sm:p-7"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
          <div className="pointer-events-none absolute -right-14 top-0 h-52 w-52 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  แผงควบคุม
                </Badge>
                <Badge className="border-white/10 bg-white/6 text-zinc-300">
                  {driveConnected ? "ระบบ: พร้อมใช้งาน" : "ระบบ: ไม่พร้อมใช้งาน"}
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

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    สมาชิก
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {totalMembers}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    สมาชิกในระบบ
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    คลัง
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {totalItems}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    ไฟล์ในระบบ
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    หมวดหมู่
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {categories.length}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    หมวดหมู่ในระบบ
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    ขนาดไฟล์
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {formatBytes(totalBytes)}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {driveConnected
                      ? "ใน Cloud"
                      : "ยังไม่ได้เชื่อมต่อกับ Cloud"}
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    พื้นที่ว่าง
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {driveConnected && remainingDriveBytes !== null
                      ? formatBytes(remainingDriveBytes)
                      : "--"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {driveConnected
                      ? "ใน Cloud"
                      : "ยังไม่ได้เชื่อมต่อกับ Cloud"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                      สถานะ Cloud ⚙️
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {driveConnected
                        ? "เชื่อมต่อแล้ว"
                        : "ยังไม่ได้เชื่อมต่อ"}
                    </p>
                    <p className="text-sm leading-6 text-zinc-400">
                      {driveConnected
                        ? `บัญชี: ${driveAccountEmail ?? "Connected successfully"}`
                        : canManageDrive
                          ? ""
                          : "กำลังรอ Admin เชื่อมต่อ Google Drive ของระบบ"}
                    </p>
                    {!driveConnected && canManageDrive ? (
                      <a
                        href="/api/google-drive/oauth/start"
                        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/12 px-4 text-sm font-medium text-emerald-50 transition-all hover:border-emerald-300/35 hover:bg-emerald-400/18"
                      >
                        <Icon name="google-drive" className="h-4 w-4" />
                        เชื่อมต่อ Google Drive
                      </a>
                    ) : null}
                  </div>
                  <div
                    className={`mt-1 h-3 w-3 rounded-full ${
                      driveConnected
                        ? "bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.65)]"
                        : "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.55)]"
                    }`}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-cyan-400/[0.06] p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    อัปโหลดล่าสุด 🚀
                  </p>
                  <p className="mt-3 text-base font-semibold text-white">
                    {latestItem ? latestItem.fileName : "ยังไม่มีไฟล์ล่าสุด"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {latestItem
                      ? `${latestItem.uploaderName} · ${formatDate(latestItem.createdAt)}`
                      : "กดอัปโหลดเพื่อเริ่มอัปโหลดไฟล์ได้เลย"}
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-emerald-400/[0.05] p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    หมวดหมู่ฮอต 🔥
                  </p>
                  <p className="mt-3 text-base font-semibold text-white">
                    {categoryLeader ? categoryLeader.name : "ยังไม่มีการอัปโหลด"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {categoryLeader
                      ? `${categoryLeader.count} ฮอตจังเลยอะเรา`
                      : "เมื่อเริ่มอัปโหลดไฟล์ ระบบจะสรุปหมวดหมู่ที่มีการใช้งานเยอะที่สุดให้"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
          <Card id="library" className="rounded-[32px]">
            <CardHeader className="border-b border-white/8 pb-5">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                      คลังเก็บไฟล์
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      คลังเก็บไฟล์
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                      เลือกดูได้ตามหมวดหมู่หรือประเภทของไฟล์
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:w-[29rem]">
                    <div className="relative">
                      <Icon
                        name="search"
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                      />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="ค้นหา"
                        className="h-12 rounded-full border-white/12 bg-white/[0.04] pl-11"
                      />
                    </div>

                    {driveConnected ? (
                      <button
                        type="button"
                        onClick={() => setUploadOpen(true)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-400/16"
                      >
                        <Icon name="upload" className="h-4 w-4" />
                        อัปโหลด
                      </button>
                    ) : (
                      <div className="inline-flex h-12 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 px-5 text-sm font-medium text-amber-100">
                        ยังไม่ได้เชื่อมต่อ Google Drive
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      activeCategory === "all"
                        ? "border-cyan-300/30 bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_14px_35px_-18px_rgba(34,211,238,0.7)]"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/15 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => setActiveCategory(category.name)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all ${
                        activeCategory === category.name
                          ? "border-cyan-300/30 bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_14px_35px_-18px_rgba(34,211,238,0.7)]"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/15 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {category.name}{" "}
                      <span className="opacity-70">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardBody className="pt-6">
              {filteredItems.length ? (
                <div className="space-y-5">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-[30px] border border-white/8 bg-black/18 transition-all duration-200 hover:border-cyan-300/20 hover:bg-white/[0.03]"
                    >
                      <div className="flex flex-col lg:flex-row">
                        <div className="relative h-56 overflow-hidden border-b border-white/8 bg-gradient-to-br from-cyan-400/[0.14] via-sky-500/[0.08] to-transparent lg:h-auto lg:w-[21rem] lg:border-b-0 lg:border-r">
                          {isPreviewableImage(item.mimeType) ? (
                            <img
                              src={`/api/media/${item.id}/content`}
                              alt={item.fileName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full min-h-56 items-center justify-center">
                              <div className="inline-flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/8 text-cyan-100">
                                <Icon
                                  name={mediaIconForMime(item.mimeType)}
                                  className="h-7 w-7"
                                />
                              </div>
                            </div>
                          )}

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            <Badge className="border-white/12 bg-black/35 text-white">
                              {item.category}
                            </Badge>
                            <Badge className="border-white/12 bg-black/35 text-white">
                              {item.mimeType.split("/")[0]}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-6">
                          <div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-2xl font-semibold text-white">
                                  {item.fileName}
                                </h3>
                                <p className="mt-2 text-sm text-zinc-400">
                                  {item.uploaderName} · {formatDate(item.createdAt)}
                                </p>
                              </div>
                              <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-400">
                                {formatBytes(item.fileSize)}
                              </span>
                            </div>

                            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">
                              {item.description || "ไม่มีโน้ตประกอบไฟล์นี้"}
                            </p>
                          </div>

                          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/6 pt-5">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-zinc-400">
                                owner vault
                              </span>
                              <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-zinc-400">
                                uploaded by {item.uploaderName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {canManageDrive ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(item)}
                                  disabled={deletingId === item.id}
                                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/18 bg-rose-400/8 px-4 py-2.5 text-sm font-medium text-rose-100 transition-all hover:border-rose-400/30 hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Icon name="trash" className="h-4 w-4" />
                                  {deletingId === item.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              ) : null}

                              <a
                                href={`/api/media/${item.id}/content`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-400/8 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-all hover:border-cyan-300/30 hover:bg-cyan-400/12"
                              >
                                เปิดไฟล์
                                <Icon name="arrow-right" className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-black/12 px-6 py-16 text-center">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-zinc-300">
                    <Icon name="search" className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    ไม่พบเนื้อหา
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
                    ลองเปลี่ยนประเภทหรือคำค้นหา หากพบไฟล์ที่ตรงกัน ไฟล์จะปรากฏในรายการนี้
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-[30px]">
              <CardHeader>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  category heat
                </p>
                <div className="mt-5 space-y-4">
                  {categories.length ? (
                    categories.map((category) => (
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
                                  Math.max(categories[0]?.count ?? 1, 1)) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No uploads yet.</p>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Card className="rounded-[30px]">
              <CardHeader>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Leaderboard
                </p>
                <div className="mt-5 space-y-3">
                  {topMembers.length ? (
                    topMembers.map((member, index) => (
                      <div
                        key={member.name}
                        className="flex items-center justify-between rounded-[22px] border border-white/8 bg-black/18 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {index + 1}. {member.name}
                          </p>
                        </div>
                        <span className="text-sm text-cyan-200">
                          {member.uploads} อัปโหลด
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">
                      ยังไม่มีกิจกรรม ณ ขณะนี้
                    </p>
                  )}
                </div>

                <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    ขยันมากมั้ง
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {topMember ? topMember.name : ""}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {topMember
                      ? `${topMember.uploads} อัปโหลด`
                      : "เริ่มอัปโหลดแล้ว leaderboard จะเริ่มทำงาน"}
                  </p>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>

      {uploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close upload modal"
            onClick={() => setUploadOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#101116] shadow-[0_40px_120px_-50px_rgba(0,0,0,0.85)]">
            <div className="border-b border-white/8 px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    upload to vault
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    เพิ่มไฟล์ใหม่เข้าเอาน้อยนอนบ้าน
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    เลือกไฟล์ ใส่หมวดกับโน้ต แล้วระบบจะส่งขึ้น owner Google Drive พร้อมบันทึกว่าใครอัปโหลด
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-7">
              <UploadForm
                onCancel={() => setUploadOpen(false)}
                onUploaded={() => setUploadOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
