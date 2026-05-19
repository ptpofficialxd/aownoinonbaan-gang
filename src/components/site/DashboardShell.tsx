"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getCategorySection,
  parseSectionFilterValue,
  type MediaItem,
} from "@/lib/media";
import { DashboardOverview } from "./dashboard/DashboardOverview";
import { InsightsSection } from "./dashboard/InsightsSection";
import { LibrarySection } from "./dashboard/LibrarySection";
import { PreviewModal } from "./dashboard/PreviewModal";
import type { DashboardSummary } from "./dashboard/types";
import { UploadModal } from "./dashboard/UploadModal";
import { useCloudHealth } from "./dashboard/useCloudHealth";
import { usePreviewText } from "./dashboard/usePreviewText";
import {
  buildDashboardSummary,
  buildMediaSearchText,
  isPreviewableFile,
} from "./dashboard/utils";

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
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [dragOverlayVisible, setDragOverlayVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const dragDepthRef = useRef(0);
  const deferredSearch = useDeferredValue(search);
  const cloudHealth = useCloudHealth(driveConnected);
  const {
    previewText,
    previewTextError,
    previewTextLoading,
    previewTextTruncated,
  } =
    usePreviewText(previewItem);

  useEffect(() => {
    function updateItemsPerPage() {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerPage(15);
        return;
      }
      if (width >= 768) {
        setItemsPerPage(12);
        return;
      }
      setItemsPerPage(9);
    }

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

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
      const activeSection = parseSectionFilterValue(activeCategory);
      const itemSection = getCategorySection(item.category);
      const matchesCategory =
        activeCategory === "all"
          ? true
          : activeSection
            ? itemSection === activeSection
            : item.category === activeCategory;
      const haystack = buildMediaSearchText(item);
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearch, libraryItems]);
  const paginationResetKey = `${activeCategory}:${deferredSearch}:${itemsPerPage}`;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage),
  );

  useEffect(() => {
    void paginationResetKey;
    setCurrentPage(1);
  }, [paginationResetKey]);

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredItems, itemsPerPage]);

  const visibleSelectableIds = useMemo(
    () =>
      paginatedItems.map((item) => item.id).filter((id) => !busyIdSet.has(id)),
    [busyIdSet, paginatedItems],
  );
  const allVisibleSelected =
    visibleSelectableIds.length > 0 &&
    visibleSelectableIds.every((id) => selectedIdSet.has(id));
  const visibleSelectedCount = paginatedItems.filter((item) =>
    selectedIdSet.has(item.id),
  ).length;
  const isSystemReady = driveConnected && cloudHealth.online;
  const canUploadNow = isSystemReady;

  useEffect(() => {
    function isDesktopViewport() {
      return window.innerWidth >= 1024;
    }

    function hasFiles(dataTransfer: DataTransfer | null) {
      if (!dataTransfer) return false;
      return Array.from(dataTransfer.types).includes("Files");
    }

    function handleDragEnter(event: DragEvent) {
      if (!isDesktopViewport() || !canUploadNow || !hasFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current += 1;
      setDragOverlayVisible(true);
    }

    function handleDragOver(event: DragEvent) {
      if (!isDesktopViewport() || !canUploadNow || !hasFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }

    function handleDragLeave(event: DragEvent) {
      if (!isDesktopViewport() || !hasFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

      if (dragDepthRef.current === 0) {
        setDragOverlayVisible(false);
      }
    }

    function handleDrop(event: DragEvent) {
      if (!isDesktopViewport() || !canUploadNow || !hasFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = 0;
      setDragOverlayVisible(false);

      const droppedFiles = Array.from(event.dataTransfer?.files ?? []);
      if (!droppedFiles.length) return;

      setPendingUploadFiles(droppedFiles);
      setUploadOpen(true);
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [canUploadNow]);

  function handleUploadedItem(items: MediaItem[]) {
    if (!items.length) {
      setUploadOpen(false);
      return;
    }

      startTransition(() => {
        setLibraryItems((current) => {
          const uploadedIds = new Set(items.map((item) => item.id));
          const withoutDuplicate = current.filter(
            (entry) => !uploadedIds.has(entry.id),
        );
        return [...items.slice().reverse(), ...withoutDuplicate];
      });
      setUploadOpen(false);
      setPendingUploadFiles([]);
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
      if (allVisibleSelected) {
        return current.filter((id) => !visibleSelectableIds.includes(id));
      }

      const next = new Set(current);
      for (const id of visibleSelectableIds) {
        next.add(id);
      }
      return Array.from(next);
    });
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);

    if (typeof window === "undefined") return;

    window.requestAnimationFrame(() => {
      const libraryElement = document.getElementById("library");
      libraryElement?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
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
            currentPage={currentPage}
            dashboard={dashboard}
            driveConnected={driveConnected}
            filteredItems={filteredItems}
            itemsPerPage={itemsPerPage}
            onDeleteItem={(item) => void handleDelete(item)}
            onDeleteSelected={() => void handleDeleteSelected()}
            onOpenPreview={openPreview}
            onPageChange={handlePageChange}
            onSearchChange={setSearch}
            onSelectAllVisible={selectAllVisible}
            onSetActiveCategory={setActiveCategory}
            onToggleSelect={toggleSelected}
            onUploadOpen={() => setUploadOpen(true)}
            allVisibleSelected={allVisibleSelected}
            paginatedItems={paginatedItems}
            search={search}
            selectedIds={selectedIds}
            selectedIdSet={selectedIdSet}
            totalPages={totalPages}
            visibleSelectedCount={visibleSelectedCount}
          />

          <InsightsSection dashboard={dashboard} />
        </section>
      </div>

      <UploadModal
        open={uploadOpen}
        initialFiles={pendingUploadFiles}
        onClose={() => {
          setUploadOpen(false);
          setPendingUploadFiles([]);
        }}
        onUploaded={handleUploadedItem}
      />

      <PreviewModal
        onClose={() => setPreviewItem(null)}
        previewItem={previewItem}
        previewText={previewText}
        previewTextError={previewTextError}
        previewTextLoading={previewTextLoading}
        previewTextTruncated={previewTextTruncated}
      />

      {dragOverlayVisible ? (
        <div className="pointer-events-none fixed inset-0 z-[60] hidden lg:block">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-8 rounded-[36px] border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_120px_-48px_rgba(34,211,238,0.65)]" />
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="max-w-xl rounded-[32px] border border-cyan-300/26 bg-[#101116]/92 px-10 py-9 text-center shadow-[0_40px_120px_-56px_rgba(0,0,0,0.9)]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-100/60">
                Drag And Drop
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-white">
                วางไฟล์ตรงนี้เพื่ออัปโหลด
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                ปล่อยเมาส์แล้วระบบจะเปิดหน้าอัปโหลดพร้อมแนบไฟล์ที่ลากมาให้ทันที
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
