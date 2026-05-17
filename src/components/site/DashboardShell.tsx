"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaItem } from "@/lib/media";
import { UploadForm } from "./UploadForm";

type MemberSummary = {
  username: string;
  name: string;
  uploads: number;
};

type CloudHealthState = {
  checkedAt: string | null;
  error: string | null;
  isPaused: boolean;
  isPolling: boolean;
  latencyMs: number | null;
  online: boolean;
};

function mediaIconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "folder";
}

function isPreviewableImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function formatLatency(latencyMs: number | null) {
  if (latencyMs === null) return "--";
  return `${Math.max(Math.round(latencyMs), 0)} ms`;
}

function formatSyncLabel(value: string | null) {
  if (!value) return "ยังไม่เคย sync";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function DashboardShell({
  canConnectDrive,
  canManageDrive,
  driveAccountEmail,
  driveConnected,
  items,
  remainingDriveBytes,
  totalMembers,
}: {
  canConnectDrive: boolean;
  canManageDrive: boolean;
  driveAccountEmail: string | null;
  driveConnected: boolean;
  items: MediaItem[];
  remainingDriveBytes: number | null;
  totalMembers: number;
}) {
  const [libraryItems, setLibraryItems] = useState(items);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [cloudHealth, setCloudHealth] = useState<CloudHealthState>({
    checkedAt: null,
    error: null,
    isPaused: false,
    isPolling: false,
    latencyMs: null,
    online: driveConnected,
  });
  const deferredSearch = useDeferredValue(search);
  const pollingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function syncUiFromHash() {
      const hash = window.location.hash;
      if (hash === "#upload") {
        setUploadOpen(true);
      }
    }

    syncUiFromHash();
    window.addEventListener("hashchange", syncUiFromHash);
    return () => window.removeEventListener("hashchange", syncUiFromHash);
  }, []);

  useEffect(() => {
    if (uploadOpen) return;
    if (window.location.hash !== "#upload") return;

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#library`,
    );
  }, [uploadOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewItem(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    function clearCloudHealthTimer() {
      if (pollingTimeoutRef.current !== null) {
        window.clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    }

    if (!driveConnected) {
      setCloudHealth({
        checkedAt: null,
        error: null,
        isPaused: false,
        isPolling: false,
        latencyMs: null,
        online: false,
      });
      return;
    }

    async function pollCloudHealth() {
      if (document.hidden) {
        return;
      }

      setCloudHealth((current) => ({
        ...current,
        error: null,
        isPaused: false,
        isPolling: true,
      }));

      try {
        const res = await fetch("/api/cloud/health", {
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({}))) as {
          checkedAt?: string;
          connected?: boolean;
          error?: string;
          latencyMs?: number | null;
        };

        setCloudHealth({
          checkedAt: data.checkedAt ?? new Date().toISOString(),
          error: res.ok ? null : (data.error ?? "Cloud health check failed."),
          isPaused: false,
          isPolling: false,
          latencyMs: typeof data.latencyMs === "number" ? data.latencyMs : null,
          online: Boolean(data.connected && res.ok),
        });
      } catch (error) {
        setCloudHealth((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : "Cloud health check failed.",
          isPaused: false,
          isPolling: false,
          online: false,
        }));
      } finally {
        clearCloudHealthTimer();

        if (!document.hidden) {
          pollingTimeoutRef.current = window.setTimeout(() => {
            void pollCloudHealth();
          }, 10_000);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearCloudHealthTimer();
        setCloudHealth((current) => ({
          ...current,
          isPaused: true,
          isPolling: false,
        }));
        return;
      }

      setCloudHealth((current) => ({
        ...current,
        isPaused: false,
      }));
      void pollCloudHealth();
    }

    void pollCloudHealth();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearCloudHealthTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [driveConnected]);

  const busyIdSet = useMemo(() => new Set(busyIds), [busyIds]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const dashboard = useMemo(() => {
    const totalBytes = libraryItems.reduce(
      (sum, item) => sum + item.fileSize,
      0,
    );
    const categoryCounts = new Map<string, number>();
    const memberCounts = new Map<string, { name: string; uploads: number }>();

    for (const item of libraryItems) {
      categoryCounts.set(
        item.category,
        (categoryCounts.get(item.category) ?? 0) + 1,
      );
      memberCounts.set(item.uploaderUsername, {
        name: item.uploaderName,
        uploads: (memberCounts.get(item.uploaderUsername)?.uploads ?? 0) + 1,
      });
    }

    const categories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topMembers = Array.from(memberCounts.entries())
      .map(([username, summary]) => ({
        username,
        name: summary.name,
        uploads: summary.uploads,
      }))
      .sort((a, b) => b.uploads - a.uploads)
      .slice(0, 4);

    return {
      totalBytes,
      totalItems: libraryItems.length,
      categories,
      topMembers,
      latestItem: libraryItems[0] ?? null,
    };
  }, [libraryItems]);

  const filteredItems = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    return libraryItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const haystack =
        `${item.fileName} ${item.description ?? ""} ${item.uploaderName} ${item.uploaderUsername}`.toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearch, libraryItems]);

  const visibleSelectedCount = filteredItems.filter((item) =>
    selectedIdSet.has(item.id),
  ).length;
  const topMember = dashboard.topMembers[0] ?? null;
  const isSystemReady = driveConnected && cloudHealth.online;
  const canUploadNow = isSystemReady;

  function handleUploadedItem(item: MediaItem | null) {
    if (!item) {
      setUploadOpen(false);
      return;
    }

    startTransition(() => {
      setLibraryItems((current) => {
        const withoutDuplicate = current.filter((entry) => entry.id !== item.id);
        return [item, ...withoutDuplicate];
      });
      setUploadOpen(false);
      setActiveCategory("all");
      setSearch("");
    });
  }

  function toggleSelected(id: string) {
    if (!canManageDrive || busyIdSet.has(id)) return;

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function selectAllVisible() {
    if (!canManageDrive) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const item of filteredItems) {
        if (!busyIdSet.has(item.id)) {
          next.add(item.id);
        }
      }
      return Array.from(next);
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function performDelete(ids: string[], fileLabel: string) {
    if (!canManageDrive || !ids.length) return;

    const ok = window.confirm(fileLabel);
    if (!ok) return;

    setBusyIds((current) => Array.from(new Set([...current, ...ids])));

    try {
      const res = await fetch("/api/media/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        deletedIds?: string[];
        failedIds?: string[];
        error?: string;
      };

      if (!res.ok && !data.deletedIds?.length) {
        throw new Error(data.error || "Delete failed");
      }

      const deletedIds = data.deletedIds ?? [];
      const failedIds = new Set(data.failedIds ?? []);

      if (deletedIds.length) {
        startTransition(() => {
          setLibraryItems((current) =>
            current.filter((item) => !deletedIds.includes(item.id)),
          );
          setSelectedIds((current) =>
            current.filter((id) => !deletedIds.includes(id)),
          );
        });
      }

      if (failedIds.size > 0) {
        window.alert(
          `ลบสำเร็จ ${deletedIds.length} ไฟล์ และมี ${failedIds.size} ไฟล์ที่ลบไม่สำเร็จ`,
        );
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "ลบไฟล์ไม่สำเร็จ");
    } finally {
      setBusyIds((current) => current.filter((id) => !ids.includes(id)));
    }
  }

  async function handleDelete(item: MediaItem) {
    await performDelete(
      [item.id],
      `ลบไฟล์ "${item.fileName}" ออกจาก Google Drive และระบบเลยไหม?`,
    );
  }

  async function handleDeleteSelected() {
    const ids = filteredItems
      .map((item) => item.id)
      .filter((id) => selectedIdSet.has(id) && !busyIdSet.has(id));

    if (!ids.length) return;

    await performDelete(
      ids,
      `ลบ ${ids.length} ไฟล์ที่เลือกออกจาก Google Drive และระบบเลยไหม?`,
    );
  }

  function openPreview(item: MediaItem) {
    if (!isPreviewableImage(item.mimeType)) return;
    setPreviewItem(item);
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-16 sm:px-6 xl:space-y-5">
        {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
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
              <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 xl:order-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        สมาชิก
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {totalMembers}
                      </p>
                    </div>
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet-300/20 bg-violet-400/10 text-violet-200 shadow-[0_0_20px_rgba(167,139,250,0.16)]">
                      <Icon name="user" className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">สมาชิกในระบบ</p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 xl:order-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        คลัง
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {dashboard.totalItems}
                      </p>
                    </div>
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.14)]">
                      <Icon name="folder" className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">ไฟล์ในระบบ</p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 xl:order-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        หมวดหมู่
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {dashboard.categories.length}
                      </p>
                    </div>
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-orange-300/20 bg-orange-300/10 text-orange-200 shadow-[0_0_20px_rgba(251,146,60,0.14)]">
                      <Icon name="tag" className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">หมวดหมู่ในระบบ</p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 xl:order-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        ขนาดไฟล์
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {formatBytes(dashboard.totalBytes)}
                      </p>
                    </div>
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300/15 bg-white/5 text-zinc-300 shadow-[0_0_18px_rgba(255,255,255,0.08)]">
                      <Icon name="file" className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {driveConnected ? "ใน Cloud" : "ยังไม่ได้เชื่อมต่อกับ Cloud"}
                  </p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 xl:order-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        พื้นที่ว่าง
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {driveConnected && remainingDriveBytes !== null
                          ? formatBytes(remainingDriveBytes)
                          : "--"}
                      </p>
                    </div>
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300/15 bg-sky-400/8 text-slate-200 shadow-[0_0_20px_rgba(125,211,252,0.12)]">
                      <Icon name="cloud" className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {driveConnected ? "ใน Cloud" : "ยังไม่ได้เชื่อมต่อกับ Cloud"}
                  </p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 xl:order-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        เวลาตอบสนอง
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {driveConnected && cloudHealth.online
                          ? formatLatency(cloudHealth.latencyMs)
                          : "--"}
                      </p>
                    </div>
                    <span
                      className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                        cloudHealth.online
                          ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                          : driveConnected
                            ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                            : "border-white/10 bg-white/5 text-zinc-500"
                      }`}
                    >
                      <Icon name="bolt" className="h-3 w-3" />
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      !cloudHealth.online && driveConnected
                        ? "text-amber-200"
                        : "text-zinc-300"
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
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                      สถานะ Cloud Server
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {driveConnected ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อมต่อ"}
                    </p>
                    <p className="break-words text-sm leading-6 text-zinc-400">
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
                      driveConnected
                        ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-[0_0_22px_rgba(74,222,128,0.18)]"
                        : "border-amber-300/20 bg-amber-300/10 text-amber-200 shadow-[0_0_20px_rgba(252,211,77,0.14)]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        driveConnected ? "bg-emerald-400" : "bg-amber-300"
                      }`}
                    />
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-cyan-400/[0.06] p-4 md:col-span-3 xl:order-8 xl:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                      อัปโหลดล่าสุด
                    </p>
                    <p className="mt-3 break-words text-base font-semibold text-white">
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

        <section className="space-y-6">
          {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
          <Card
            id="library"
            className="scroll-mt-34 w-full min-w-0 rounded-[32px]"
          >
            <CardHeader className="border-b border-white/8 pb-5">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="w-fit border-white/10 bg-white/6 text-zinc-300">
                        คลังเก็บไฟล์
                      </Badge>
                      <Badge
                        className={
                          isSystemReady
                            ? "!border-emerald-300/25 !bg-emerald-400/14 !text-emerald-100"
                            : "!border-rose-300/25 !bg-rose-400/14 !text-rose-100"
                        }
                      >
                        {isSystemReady
                          ? "ระบบ: พร้อมอัปโหลด"
                          : "ระบบ: ไม่พร้อมอัปโหลด"}
                      </Badge>
                    </div>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      Library
                      <span className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {" "}
                        ไฟล์ในระบบ
                      </span>
                    </h2>
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
                        placeholder="ค้นหาชื่อไฟล์ คนอัปโหลด หรือโน้ต"
                        className="h-12 rounded-full border-white/12 bg-white/[0.04] pl-11"
                      />
                    </div>

                    {canUploadNow ? (
                      <button
                        type="button"
                        onClick={() => setUploadOpen(true)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-400/16"
                      >
                        <Icon name="upload" className="h-4 w-4" />
                        อัปโหลด
                      </button>
                    ) : driveConnected ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-rose-300/18 bg-rose-400/8 px-5 text-sm font-medium text-rose-100/70 opacity-80"
                        title="Cloud health check ไม่ผ่าน จึงยังไม่พร้อมอัปโหลด"
                      >
                        <Icon name="upload" className="h-4 w-4" />
                        ไม่พร้อมอัปโหลด
                      </button>
                    ) : null}
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
                    ทั้งหมด{" "}
                    <span className="opacity-70">({dashboard.totalItems})</span>
                  </button>
                  {dashboard.categories.map((category) => (
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
                  <div className="sticky top-4 z-10 overflow-hidden rounded-[22px] border border-white/10 bg-[#0d1016]/85 p-3 sm:rounded-[26px] sm:p-4 backdrop-blur-xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />
                    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-medium text-white sm:text-sm">
                          {filteredItems.length} ไฟล์ในมุมมองนี้
                        </p>
                        <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                          {canManageDrive
                            ? `${selectedIds.length} ไฟล์ถูกเลือกอยู่ ตอนนี้เห็นในหน้าจอ ${visibleSelectedCount} ไฟล์`
                            : "เปิดดูไฟล์ได้ทันทีจากการ์ดแต่ละใบ"}
                        </p>
                      </div>

                      {canManageDrive ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={selectAllVisible}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-all hover:border-white/15 hover:bg-white/[0.08] sm:h-10 sm:px-4 sm:text-sm"
                          >
                            เลือกทั้งหมดที่เห็น
                          </button>
                          <button
                            type="button"
                            onClick={clearSelection}
                            disabled={selectedIds.length === 0}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-all hover:border-white/15 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
                          >
                            ล้างการเลือก
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteSelected()}
                            disabled={visibleSelectedCount === 0}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-rose-400/18 bg-rose-400/10 px-3 text-xs font-medium text-rose-100 transition-all hover:border-rose-400/30 hover:bg-rose-400/16 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                            ลบไฟล์ที่เลือก
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-3 2xl:grid-cols-5">
                    {filteredItems.map((item) => {
                      const isSelected = selectedIdSet.has(item.id);
                      const isBusy = busyIdSet.has(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`group relative overflow-hidden rounded-[22px] border transition-all duration-200 sm:rounded-[24px] xl:rounded-[28px] ${
                            isSelected
                              ? "border-cyan-300/35 bg-cyan-400/[0.08] shadow-[0_22px_50px_-28px_rgba(34,211,238,0.55)]"
                              : "border-white/8 bg-black/18 hover:border-cyan-300/20 hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                          {canManageDrive ? (
                            <button
                              type="button"
                              onClick={() => toggleSelected(item.id)}
                              disabled={isBusy}
                              className={`absolute left-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-md transition-all sm:left-3 sm:top-3 sm:h-9 sm:w-9 ${
                                isSelected
                                  ? "border-cyan-300/45 bg-cyan-300 text-slate-950"
                                  : "border-white/12 bg-black/40 text-white hover:border-white/30 hover:bg-black/55"
                              }`}
                              aria-label={
                                isSelected
                                  ? `ยกเลิกการเลือก ${item.fileName}`
                                  : `เลือก ${item.fileName}`
                              }
                            >
                              {isSelected ? (
                                <Icon name="check" className="h-4 w-4" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-current" />
                              )}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => openPreview(item)}
                            disabled={!isPreviewableImage(item.mimeType)}
                            className={`relative block aspect-square w-full overflow-hidden border-b border-white/8 bg-gradient-to-br from-cyan-400/[0.14] via-sky-500/[0.08] to-transparent text-left md:aspect-[4/3] ${
                              isPreviewableImage(item.mimeType)
                                ? "cursor-zoom-in"
                                : "cursor-default"
                            }`}
                          >
                            {isPreviewableImage(item.mimeType) ? (
                              <>
                                {/* biome-ignore lint/performance/noImgElement: authenticated media preview is streamed from a protected route */}
                                <img
                                  src={`/api/media/${item.id}/content`}
                                  alt={item.fileName}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                              </>
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <div className="inline-flex h-18 w-18 items-center justify-center rounded-[24px] border border-white/10 bg-white/8 text-cyan-100">
                                  <Icon
                                    name={mediaIconForMime(item.mimeType)}
                                    className="h-8 w-8"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 to-transparent sm:h-24" />
                            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5 sm:bottom-3 sm:left-3 sm:right-3 sm:gap-2">
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                <Badge className="border-white/12 bg-black/35 px-2 py-0.5 text-[9px] tracking-[0.14em] text-white sm:px-3 sm:py-1 sm:text-[11px]">
                                  {item.category}
                                </Badge>
                                <Badge className="border-white/12 bg-black/35 px-2 py-0.5 text-[9px] tracking-[0.14em] text-white sm:px-3 sm:py-1 sm:text-[11px]">
                                  {item.mimeType.split("/")[0]}
                                </Badge>
                              </div>
                              <span className="rounded-full border border-white/12 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-zinc-200 sm:px-2.5 sm:py-1 sm:text-[11px]">
                                {formatBytes(item.fileSize)}
                              </span>
                            </div>
                          </button>

                          <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
                            <div className="space-y-1.5 sm:space-y-2">
                              <h3
                                className="truncate text-sm font-semibold text-white sm:text-base"
                                title={item.fileName}
                              >
                                {item.fileName}
                              </h3>
                              <p className="truncate text-xs text-zinc-400 sm:text-sm">
                                @{item.uploaderUsername}
                              </p>
                              <p className="text-[11px] text-zinc-500 sm:text-xs">
                                {formatDate(item.createdAt)}
                              </p>
                            </div>

                            <p className="hidden min-h-10 text-sm leading-5 text-zinc-400 lg:block">
                              {item.description || "ไม่มีโน้ตประกอบไฟล์นี้"}
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-0.5 sm:pt-1">
                              {canManageDrive ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(item)}
                                  disabled={isBusy}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-400/18 bg-rose-400/8 text-rose-100 transition-all hover:border-rose-400/30 hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10"
                                  aria-label={`ลบ ${item.fileName}`}
                                >
                                  <Icon name="trash" className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                <Badge className="w-fit border-white/10 bg-white/6 text-zinc-300">
                  ฮิตจังอะเรา
                </Badge>
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
                                  Math.max(
                                    dashboard.categories[0]?.count ?? 1,
                                    1,
                                  )) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">
                      ยังไม่มีการอัปโหลด ณ ขณะนี้
                    </p>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Card className="rounded-[30px]">
              <CardHeader>
                <Badge className="w-fit border-white/10 bg-white/6 text-zinc-300">
                  จำนวนอัปโหลด
                </Badge>
                <div className="mt-5 space-y-3">
                  {dashboard.topMembers.length ? (
                    dashboard.topMembers.map((member: MemberSummary, index) => (
                      <div
                        key={member.username}
                        className="flex items-center justify-between rounded-[22px] border border-white/8 bg-black/18 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {index + 1}. @{member.username}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {member.name}
                          </p>
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

          <div className="relative z-10 w-full max-w-3xl overflow-visible rounded-[32px] border border-white/10 bg-[#101116] shadow-[0_40px_120px_-50px_rgba(0,0,0,0.85)]">
            <div className="border-b border-white/8 px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="w-fit border-white/10 bg-white/6 text-zinc-300">
                    อัปโหลดไฟล์
                  </Badge>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    เลือกไฟล์ที่ต้องการอัปโหลด
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    แบ่งปันความน่ารักของสาวๆกันครัฟพี่
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
                onUploaded={handleUploadedItem}
              />
            </div>
          </div>
        </div>
      ) : null}

      {previewItem ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md sm:p-5">
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setPreviewItem(null)}
            className="absolute inset-0"
          />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0d12] shadow-[0_45px_140px_-40px_rgba(0,0,0,0.95)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white sm:text-base">
                  {previewItem.fileName}
                </p>
                <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                  คลิกขวา หรือกดค้างบนรูปเพื่อบันทึกไฟล์ได้เลย
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-auto p-3 sm:p-5">
              <div className="flex min-h-[40vh] items-center justify-center">
                {/* biome-ignore lint/performance/noImgElement: authenticated media preview must remain directly savable from the lightbox */}
                <img
                  src={`/api/media/${previewItem.id}/content`}
                  alt={previewItem.fileName}
                  className="max-h-[78vh] w-auto max-w-full rounded-[20px] object-contain select-auto"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
