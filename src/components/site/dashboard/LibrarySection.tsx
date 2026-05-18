import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaItem } from "@/lib/media";
import type { DashboardSummary } from "./types";
import { getMimeBadgeLabel, getPreviewKind, isPreviewableFile } from "./utils";

export function LibrarySection({
  activeCategory,
  allVisibleSelected,
  busyIdSet,
  canManageDrive,
  canUploadNow,
  currentPage,
  dashboard,
  driveConnected,
  filteredItems,
  itemsPerPage,
  onDeleteItem,
  onDeleteSelected,
  onOpenPreview,
  onPageChange,
  onSearchChange,
  onSelectAllVisible,
  onSetActiveCategory,
  onToggleSelect,
  onUploadOpen,
  paginatedItems,
  search,
  selectedIds,
  selectedIdSet,
  totalPages,
  visibleSelectedCount,
}: {
  activeCategory: string;
  allVisibleSelected: boolean;
  busyIdSet: Set<string>;
  canManageDrive: boolean;
  canUploadNow: boolean;
  currentPage: number;
  dashboard: DashboardSummary;
  driveConnected: boolean;
  filteredItems: MediaItem[];
  itemsPerPage: number;
  onDeleteItem: (item: MediaItem) => void;
  onDeleteSelected: () => void;
  onOpenPreview: (item: MediaItem) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onSelectAllVisible: () => void;
  onSetActiveCategory: (value: string) => void;
  onToggleSelect: (id: string) => void;
  onUploadOpen: () => void;
  paginatedItems: MediaItem[];
  search: string;
  selectedIds: string[];
  selectedIdSet: Set<string>;
  totalPages: number;
  visibleSelectedCount: number;
}) {
  const isSystemReady = canUploadNow;
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const mobileCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const pageStart = filteredItems.length
    ? (currentPage - 1) * itemsPerPage + 1
    : 0;
  const pageEnd = filteredItems.length
    ? Math.min(currentPage * itemsPerPage, filteredItems.length)
    : 0;
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter((page) => {
    if (totalPages <= 5) return true;
    if (page === 1 || page === totalPages) return true;
    return Math.abs(page - currentPage) <= 1;
  });
  const activeCategorySummary =
    activeCategory === "all"
      ? {
          name: "ทั้งหมด",
          count: dashboard.totalItems,
        }
      : dashboard.categories.find((category) => category.name === activeCategory);
  const uploadButton = canUploadNow ? (
    <button
      type="button"
      onClick={onUploadOpen}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-400/16 sm:px-5"
    >
      <Icon name="upload" className="h-4 w-4" />
      <span className="hidden sm:inline">อัปโหลด</span>
    </button>
  ) : driveConnected ? (
    <button
      type="button"
      disabled
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-rose-300/18 bg-rose-400/8 px-4 text-sm font-medium text-rose-100/70 opacity-80 sm:px-5"
      title="Cloud health check ไม่ผ่าน จึงยังไม่พร้อมอัปโหลด"
    >
      <Icon name="upload" className="h-4 w-4" />
      <span className="hidden sm:inline">ไม่พร้อมอัปโหลด</span>
    </button>
  ) : null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const clickedInsideMobileCategory = mobileCategoryMenuRef.current?.contains(
        event.target as Node,
      );
      const clickedInsideDesktopCategory =
        desktopCategoryMenuRef.current?.contains(event.target as Node);

      if (!clickedInsideMobileCategory && !clickedInsideDesktopCategory) {
        setCategoryMenuOpen(false);
      }
      if (!actionMenuRef.current?.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategoryMenuOpen(false);
        setActionMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
      <Card
        id="library"
        className="scroll-mt-16.5 w-full min-w-0 rounded-[32px]"
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
                    {isSystemReady ? "ระบบ: พร้อมอัปโหลด" : "ระบบ: ไม่พร้อมอัปโหลด"}
                  </Badge>
                </div>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Library
                  <span className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {" "}
                    ไฟล์ในระบบ
                  </span>
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  แบ่งปันความน่ารักของสาวๆกันครัฟเพ่
                </p>
              </div>

              <div className="w-full lg:w-[29rem]">
                <div
                  className={`relative lg:hidden ${categoryMenuOpen ? "z-40" : ""}`}
                  ref={mobileCategoryMenuRef}
                >
                  <div className="flex items-stretch gap-2 sm:gap-3">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={categoryMenuOpen}
                      aria-label="เลือกหมวดหมู่ในคลัง"
                      onClick={() => setCategoryMenuOpen((open) => !open)}
                      className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] text-cyan-100 shadow-[0_16px_34px_-24px_rgba(34,211,238,0.45)] ring-1 ring-inset ring-white/8 transition-all duration-200 hover:border-cyan-300/20 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/35 sm:w-[12.5rem] sm:justify-between sm:px-3"
                    >
                      <span className="inline-flex items-center justify-center sm:h-8 sm:w-8 sm:rounded-2xl sm:bg-cyan-300/10 sm:ring-1 sm:ring-inset sm:ring-cyan-200/10">
                        <Icon name="heart" className="h-4 w-4" />
                      </span>
                      <span className="hidden min-w-0 flex-1 items-center gap-3 px-3 sm:flex">
                        <span className="min-w-0 text-left">
                          <span className="block truncate text-sm font-medium leading-tight text-white">
                            {activeCategorySummary?.name ?? "ทั้งหมด"}
                          </span>
                          <span className="mt-1 block text-[11px] tracking-[0.12em] text-zinc-500">
                            {activeCategorySummary?.count ?? 0} ไฟล์
                          </span>
                        </span>
                      </span>
                      <span
                        className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition-all duration-200 sm:inline-flex ${
                          categoryMenuOpen
                            ? "rotate-180 border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                            : "group-hover:border-cyan-300/18 group-hover:text-white"
                        }`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="h-4 w-4"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="m5.5 7.5 4.5 4.5 4.5-4.5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                      </span>
                    </button>

                    <div className="relative min-w-0 flex-1 sm:flex-[1.35]">
                      <Icon
                        name="search"
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                      />
                      <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="ค้นหา..."
                        className="h-12 rounded-full border-white/12 bg-white/[0.04] pl-11"
                      />
                    </div>

                    {uploadButton}
                  </div>

                  <div
                    className={`absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[24px] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,12,18,0.98),rgba(5,8,15,0.98))] p-2 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04),0_0_36px_rgba(34,211,238,0.08)] backdrop-blur-xl transition-all duration-200 ${
                      categoryMenuOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-2 opacity-0"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between px-2 pt-1">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                          เลือกหมวดหมู่
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {activeCategorySummary?.name ?? "ทั้งหมด"} ·{" "}
                          {activeCategorySummary?.count ?? 0} ไฟล์
                        </p>
                      </div>
                      <p className="text-[11px] text-cyan-100/60">
                        {dashboard.categories.length + 1} ตัวเลือก
                      </p>
                    </div>

                    <div
                      role="listbox"
                      className="max-h-80 space-y-1 overflow-y-auto pr-1"
                    >
                      <CategoryFilterOption
                        active={activeCategory === "all"}
                        count={dashboard.totalItems}
                        label="ทั้งหมด"
                        onClick={() => {
                          onSetActiveCategory("all");
                          setCategoryMenuOpen(false);
                        }}
                      />
                      {dashboard.categories.map((category) => (
                        <CategoryFilterOption
                          key={category.name}
                          active={activeCategory === category.name}
                          count={category.count}
                          label={category.name}
                          onClick={() => {
                            onSetActiveCategory(category.name);
                            setCategoryMenuOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                  <div
                    className={`w-[17.5rem] shrink-0 ${categoryMenuOpen ? "relative z-40" : ""}`}
                    ref={desktopCategoryMenuRef}
                  >
                    <div className="relative">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={categoryMenuOpen}
                        aria-label="เลือกหมวดหมู่ในคลัง"
                        onClick={() => setCategoryMenuOpen((open) => !open)}
                        className="group flex h-12 w-full items-center justify-between rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-4 py-3 text-left text-white shadow-[0_16px_34px_-24px_rgba(34,211,238,0.45)] ring-1 ring-inset ring-white/8 transition-all duration-200 hover:border-cyan-300/20 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/35"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-100 ring-1 ring-inset ring-cyan-200/10">
                            <Icon name="heart" className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-tight text-white">
                              {activeCategorySummary?.name ?? "ทั้งหมด"}
                            </p>
                            <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">
                              {activeCategorySummary?.count ?? 0} ไฟล์
                            </p>
                          </div>
                        </div>
                        <div
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition-all duration-200 ${
                            categoryMenuOpen
                              ? "rotate-180 border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                              : "group-hover:border-cyan-300/18 group-hover:text-white"
                          }`}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            className="h-4 w-4"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="m5.5 7.5 4.5 4.5 4.5-4.5"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </div>
                      </button>

                      <div
                        className={`absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[24px] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,12,18,0.98),rgba(5,8,15,0.98))] p-2 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04),0_0_36px_rgba(34,211,238,0.08)] backdrop-blur-xl transition-all duration-200 ${
                          categoryMenuOpen
                            ? "pointer-events-auto translate-y-0 opacity-100"
                            : "pointer-events-none -translate-y-2 opacity-0"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between px-2 pt-1">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                            เลือกหมวดหมู่
                          </p>
                          <p className="text-[11px] text-cyan-100/60">
                            {dashboard.categories.length + 1} ตัวเลือก
                          </p>
                        </div>

                        <div
                          role="listbox"
                          className="max-h-80 space-y-1 overflow-y-auto pr-1"
                        >
                          <CategoryFilterOption
                            active={activeCategory === "all"}
                            count={dashboard.totalItems}
                            label="ทั้งหมด"
                            onClick={() => {
                              onSetActiveCategory("all");
                              setCategoryMenuOpen(false);
                            }}
                          />
                          {dashboard.categories.map((category) => (
                            <CategoryFilterOption
                              key={category.name}
                              active={activeCategory === category.name}
                              count={category.count}
                              label={category.name}
                              onClick={() => {
                                onSetActiveCategory(category.name);
                                setCategoryMenuOpen(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Icon
                      name="search"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                    />
                    <Input
                      value={search}
                      onChange={(event) => onSearchChange(event.target.value)}
                      placeholder="ค้นหา..."
                      className="h-12 rounded-full border-white/12 bg-white/[0.04] pl-11"
                    />
                  </div>

                  {uploadButton}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-6">
          {filteredItems.length ? (
            <div className="space-y-5">
              <div className="sticky top-4 z-30 overflow-visible rounded-[22px] border border-white/10 bg-[#0d1016]/85 p-3 backdrop-blur-xl sm:rounded-[26px] sm:p-4">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white sm:text-sm">
                      {filteredItems.length} ไฟล์ในหมวดหมู่นี้
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                      {canManageDrive
                        ? `${selectedIds.length} ไฟล์ถูกเลือกอยู่`
                        : `แสดง ${pageStart}-${pageEnd} จาก ${filteredItems.length} ไฟล์`}
                    </p>
                  </div>

                  {canManageDrive ? (
                    <div
                      className="relative ml-auto w-auto shrink-0 self-start"
                      ref={actionMenuRef}
                    >
                      <button
                        type="button"
                        onClick={() => setActionMenuOpen((open) => !open)}
                        aria-haspopup="menu"
                        aria-expanded={actionMenuOpen}
                        className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-2.5 text-xs font-medium text-zinc-100 transition-all hover:border-cyan-300/20 hover:bg-cyan-400/[0.07] hover:text-white sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-100 ring-1 ring-inset ring-cyan-200/10 sm:h-7 sm:w-7">
                          <Icon name="bolt" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </span>
                        <span className="sm:hidden">จัดการ</span>
                        <span className="hidden sm:inline">จัดการรายการ</span>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition-all duration-200 sm:h-7 sm:w-7 ${
                            actionMenuOpen
                              ? "rotate-180 border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                              : "group-hover:border-cyan-300/18 group-hover:text-white"
                          }`}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="m5.5 7.5 4.5 4.5 4.5-4.5"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                            />
                          </svg>
                        </span>
                      </button>

                      <div
                        className={`absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[17rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-[24px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(10,14,20,0.98),rgba(7,10,16,0.98))] p-2 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.92),0_0_0_1px_rgba(255,255,255,0.04),0_0_36px_rgba(34,211,238,0.08)] backdrop-blur-xl transition-all duration-200 sm:w-[20rem] ${
                          actionMenuOpen
                            ? "pointer-events-auto translate-y-0 opacity-100"
                            : "pointer-events-none -translate-y-2 opacity-0"
                        }`}
                      >
                        <div className="mb-2 px-2 pt-1">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                            เมนูการจัดการ
                          </p>
                        </div>

                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={onSelectAllVisible}
                            className="flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left text-sm text-zinc-200 transition-all hover:bg-white/[0.05] hover:text-white"
                          >
                            <span className="font-medium">
                              {allVisibleSelected
                                ? "ยกเลิกเลือกทั้งหมดที่เห็น"
                                : "เลือกทั้งหมดที่เห็น"}
                            </span>
                            <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-400">
                              {visibleSelectedCount}/{paginatedItems.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={onDeleteSelected}
                            disabled={visibleSelectedCount === 0}
                            className="flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left text-sm text-rose-100 transition-all hover:bg-rose-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <span className="inline-flex items-center gap-2 font-medium">
                              <Icon name="trash" className="h-4 w-4" />
                              ลบไฟล์ที่เลือก
                            </span>
                            <span className="rounded-full bg-rose-400/10 px-2 py-1 text-[11px] text-rose-200/80">
                              {visibleSelectedCount}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-3 lg:grid-cols-5">
                {paginatedItems.map((item) => (
                  <MediaCard
                    key={item.id}
                    busyIdSet={busyIdSet}
                    canManageDrive={canManageDrive}
                    isSelected={selectedIdSet.has(item.id)}
                    item={item}
                    onDeleteItem={onDeleteItem}
                    onOpenPreview={onOpenPreview}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-medium text-white">
                      หน้า {currentPage} / {totalPages}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                      กำลังดูไฟล์ {pageStart}-{pageEnd} จากทั้งหมด {filteredItems.length} ไฟล์
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-200 transition-all hover:border-cyan-300/20 hover:bg-cyan-400/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="m11.5 5.5-4.5 4.5 4.5 4.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                      ก่อนหน้า
                    </button>

                    <div className="flex items-center gap-2">
                      {pageNumbers.map((page, index) => {
                        const previousPage = pageNumbers[index - 1];
                        const showGap =
                          index > 0 && previousPage && page - previousPage > 1;

                        return (
                          <div key={page} className="flex items-center gap-2">
                            {showGap ? (
                              <span className="px-1 text-sm text-zinc-500">
                                ...
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onPageChange(page)}
                              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition-all ${
                                currentPage === page
                                  ? "border-cyan-300/30 bg-[linear-gradient(180deg,rgba(34,211,238,0.22),rgba(14,165,233,0.14))] text-cyan-100 shadow-[0_12px_28px_-18px_rgba(34,211,238,0.9)]"
                                  : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-cyan-300/18 hover:bg-cyan-400/[0.08] hover:text-white"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onPageChange(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-200 transition-all hover:border-cyan-300/20 hover:bg-cyan-400/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      ถัดไป
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="m8.5 5.5 4.5 4.5-4.5 4.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : null}
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
    </>
  );
}

function CategoryFilterOption({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left text-sm transition-all ${
        active
          ? "bg-[linear-gradient(90deg,rgba(34,211,238,0.2),rgba(59,130,246,0.08))] text-white ring-1 ring-inset ring-cyan-300/26"
          : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <span className="font-medium tracking-[0.08em]">{label}</span>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] ${
          active
            ? "bg-cyan-300/16 text-cyan-100"
            : "bg-white/[0.04] text-zinc-500"
        }`}
      >
        {count}
        {active ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function MediaCard({
  busyIdSet,
  canManageDrive,
  isSelected,
  item,
  onDeleteItem,
  onOpenPreview,
  onToggleSelect,
}: {
  busyIdSet: Set<string>;
  canManageDrive: boolean;
  isSelected: boolean;
  item: MediaItem;
  onDeleteItem: (item: MediaItem) => void;
  onOpenPreview: (item: MediaItem) => void;
  onToggleSelect: (id: string) => void;
}) {
  const isBusy = busyIdSet.has(item.id);
  const previewKind = getPreviewKind(item.mimeType);
  const previewable = isPreviewableFile(item.mimeType);

  return (
    <div
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
          onClick={() => onToggleSelect(item.id)}
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
        onClick={() => onOpenPreview(item)}
        disabled={!previewable}
        className={`relative block aspect-square w-full overflow-hidden border-b border-white/8 bg-gradient-to-br from-cyan-400/[0.14] via-sky-500/[0.08] to-transparent text-left md:aspect-[4/3] ${
          previewable ? "cursor-zoom-in" : "cursor-default"
        }`}
      >
        {previewKind === "image" ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: authenticated media preview is streamed from a protected route */}
            <img
              src={`/api/media/${item.id}/content`}
              alt={item.fileName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </>
        ) : (
          <>
            {/* biome-ignore lint/performance/noImgElement: thumbnail preview is proxied from a protected route */}
            <img
              src={`/api/media/${item.id}/thumbnail`}
              alt={item.fileName}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                previewKind === "video" ? "object-center" : "object-top"
              }`}
            />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 to-transparent sm:h-24" />
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5 sm:bottom-3 sm:left-3 sm:right-3 sm:gap-2">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge className="border-white/12 bg-black/35 px-2 py-0.5 text-[9px] tracking-[0.14em] text-white sm:px-3 sm:py-1 sm:text-[11px]">
              {item.category}
            </Badge>
            <Badge className="border-white/12 bg-black/35 px-2 py-0.5 text-[9px] tracking-[0.14em] text-white sm:px-3 sm:py-1 sm:text-[11px]">
              {getMimeBadgeLabel(item.mimeType)}
            </Badge>
          </div>
          <span className="whitespace-nowrap rounded-full border border-white/12 bg-black/40 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-200 sm:px-2.5 sm:py-1 sm:text-[11px]">
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
              onClick={() => onDeleteItem(item)}
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
}
