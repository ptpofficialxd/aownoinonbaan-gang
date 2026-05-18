"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MediaItem } from "@/lib/media";
import { DashboardOverview } from "./dashboard/DashboardOverview";
import { InsightsSection } from "./dashboard/InsightsSection";
import { LibrarySection } from "./dashboard/LibrarySection";
import { PreviewModal } from "./dashboard/PreviewModal";
import type { DashboardSummary } from "./dashboard/types";
import { UploadModal } from "./dashboard/UploadModal";
import { useCloudHealth } from "./dashboard/useCloudHealth";
import { usePreviewText } from "./dashboard/usePreviewText";
import { buildDashboardSummary, isPreviewableFile } from "./dashboard/utils";

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
  const deferredSearch = useDeferredValue(search);
  const cloudHealth = useCloudHealth(driveConnected);
  const { previewText, previewTextError, previewTextLoading } =
    usePreviewText(previewItem);

  useEffect(() => {
    function syncUiFromHash() {
      if (window.location.hash === "#upload") {
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

  const busyIdSet = useMemo(() => new Set(busyIds), [busyIds]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const dashboard: DashboardSummary = useMemo(
    () => buildDashboardSummary(libraryItems),
    [libraryItems],
  );

  const filteredItems = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    return libraryItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const haystack =
        `${item.fileName} ${item.description ?? ""} ${item.uploaderName} ${item.uploaderUsername} ${item.category}`.toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearch, libraryItems]);

  const visibleSelectedCount = filteredItems.filter((item) =>
    selectedIdSet.has(item.id),
  ).length;
  const isSystemReady = driveConnected && cloudHealth.online;
  const canUploadNow = isSystemReady;

  function handleUploadedItem(item: MediaItem | null) {
    if (!item) {
      setUploadOpen(false);
      return;
    }

    startTransition(() => {
      setLibraryItems((current) => {
        const withoutDuplicate = current.filter(
          (entry) => entry.id !== item.id,
        );
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

      if (previewItem && deletedIds.includes(previewItem.id)) {
        setPreviewItem(null);
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
    if (!isPreviewableFile(item.mimeType)) return;
    setPreviewItem(item);
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-8 sm:px-6">
        <DashboardOverview
          canConnectDrive={canConnectDrive}
          cloudHealth={cloudHealth}
          dashboard={dashboard}
          driveAccountEmail={driveAccountEmail}
          driveConnected={driveConnected}
          remainingDriveBytes={remainingDriveBytes}
          totalMembers={totalMembers}
        />

        <section className="space-y-6">
          <LibrarySection
            activeCategory={activeCategory}
            busyIdSet={busyIdSet}
            canManageDrive={canManageDrive}
            canUploadNow={canUploadNow}
            dashboard={dashboard}
            driveConnected={driveConnected}
            filteredItems={filteredItems}
            onClearSelection={clearSelection}
            onDeleteItem={(item) => void handleDelete(item)}
            onDeleteSelected={() => void handleDeleteSelected()}
            onOpenPreview={openPreview}
            onSearchChange={setSearch}
            onSelectAllVisible={selectAllVisible}
            onSetActiveCategory={setActiveCategory}
            onToggleSelect={toggleSelected}
            onUploadOpen={() => setUploadOpen(true)}
            search={search}
            selectedIds={selectedIds}
            selectedIdSet={selectedIdSet}
            visibleSelectedCount={visibleSelectedCount}
          />

          <InsightsSection dashboard={dashboard} />
        </section>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploadedItem}
      />

      <PreviewModal
        onClose={() => setPreviewItem(null)}
        previewItem={previewItem}
        previewText={previewText}
        previewTextError={previewTextError}
        previewTextLoading={previewTextLoading}
      />
    </>
  );
}
