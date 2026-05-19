import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { formatBytes, formatDate, formatDateCompact } from "@/lib/format";
import {
  CATEGORY_SECTION_NAMES,
  createSectionFilterValue,
  getCategoriesForSection,
  getCategorySection,
  parseSectionFilterValue,
  type CategorySection,
  type MediaItem,
} from "@/lib/media";
import type { DashboardSummary } from "./types";
import { getMimeBadgeLabel, getPreviewKind, isPreviewableFile } from "./utils";

const videoThumbnailCache = new Map<string, string>();

function getSectionAccentClass(section: CategorySection) {
  if (section === "CGM48") {
    return {
      tab: "border-[#45baa8]/55 bg-[linear-gradient(180deg,rgba(69,186,168,0.22),rgba(69,186,168,0.08))] text-white shadow-[0_12px_28px_-18px_rgba(69,186,168,0.55)]",
      option:
        "border-[#45baa8]/30 bg-[linear-gradient(135deg,rgba(69,186,168,0.18),rgba(69,186,168,0.07))] text-white shadow-[0_16px_36px_-28px_rgba(69,186,168,0.45)]",
      rail: "bg-gradient-to-r from-transparent via-[#45baa8]/70 to-transparent",
      dot: "border-[#45baa8]/30 bg-[#45baa8]/18 text-[#9be2d8]",
    };
  }

  if (section === "BNK48") {
    return {
      tab: "border-[#c492c2]/55 bg-[linear-gradient(180deg,rgba(196,146,194,0.24),rgba(196,146,194,0.1))] text-white shadow-[0_12px_28px_-18px_rgba(196,146,194,0.48)]",
      option:
        "border-[#c492c2]/30 bg-[linear-gradient(135deg,rgba(196,146,194,0.18),rgba(196,146,194,0.08))] text-white shadow-[0_16px_36px_-28px_rgba(196,146,194,0.42)]",
      rail: "bg-gradient-to-r from-transparent via-[#c492c2]/70 to-transparent",
      dot: "border-[#c492c2]/30 bg-[#c492c2]/18 text-[#e3bde0]",
    };
  }

  return {
    tab: "border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-white shadow-[0_12px_28px_-18px_rgba(148,163,184,0.28)]",
    option:
      "border-white/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(148,163,184,0.05))] text-white shadow-[0_16px_36px_-28px_rgba(148,163,184,0.2)]",
    rail: "bg-gradient-to-r from-transparent via-white/30 to-transparent",
    dot: "border-white/14 bg-white/[0.08] text-zinc-200",
  };
}

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
  const [categorySection, setCategorySection] = useState<CategorySection>("ALL");
  const [mounted, setMounted] = useState(false);
  const [categoryDropdownPos, setCategoryDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 0,
  });
  const mobileToolbarRef = useRef<HTMLDivElement | null>(null);
  const mobileCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileCategoryButtonRef = useRef<HTMLButtonElement | null>(null);
  const desktopCategoryButtonRef = useRef<HTMLButtonElement | null>(null);
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
  const categoryCountMap = new Map(
    dashboard.categories.map((category) => [category.name, category.count]),
  );
  const sectionCountMap = new Map(
    CATEGORY_SECTION_NAMES.map((section) => [
      section,
      section === "ALL"
        ? dashboard.totalItems
        : dashboard.categories
            .filter((category) => getCategorySection(category.name) === section)
            .reduce((sum, category) => sum + category.count, 0),
    ]),
  );
  const activeSectionFilter = parseSectionFilterValue(activeCategory);
  const activeCategorySummary =
    activeCategory === "all"
      ? {
          name: "ทั้งหมด",
          count: dashboard.totalItems,
        }
      : activeSectionFilter
        ? {
            name: "ทั้งหมด",
            count: sectionCountMap.get(activeSectionFilter) ?? 0,
          }
        : {
            name: activeCategory,
            count:
              dashboard.categories.find((category) => category.name === activeCategory)
                ?.count ?? 0,
          };
  const sectionCategories = [...getCategoriesForSection(categorySection)] as string[];
  const orderedSectionCategories =
    !activeSectionFilter &&
    activeCategory !== "all" &&
    sectionCategories.includes(activeCategory)
      ? [
          activeCategory,
          ...sectionCategories.filter((category) => category !== activeCategory),
        ]
      : sectionCategories;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const sectionFilter = parseSectionFilterValue(activeCategory);
    if (sectionFilter) {
      setCategorySection(sectionFilter);
      return;
    }

    if (activeCategory === "all") {
      setCategorySection("ALL");
      return;
    }

    const nextSection = getCategorySection(activeCategory);
    if (nextSection) {
      setCategorySection(nextSection);
    }
  }, [activeCategory]);
  const uploadButton = canUploadNow ? (
    <button
      type="button"
      onClick={onUploadOpen}
      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-100 transition-all hover:border-cyan-300/35 hover:bg-cyan-400/16 sm:px-5"
    >
      <Icon name="upload" className="h-4 w-4" />
      <span className="hidden whitespace-nowrap sm:inline">อัปโหลด</span>
    </button>
  ) : driveConnected ? (
    <button
      type="button"
      disabled
      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-rose-300/18 bg-rose-400/8 px-4 text-sm font-medium text-rose-100/70 opacity-80 sm:px-5"
      title="Cloud health check ไม่ผ่าน จึงยังไม่พร้อมอัปโหลด"
    >
      <Icon name="upload" className="h-4 w-4" />
      <span className="hidden whitespace-nowrap sm:inline">ไม่พร้อมอัปโหลด</span>
    </button>
  ) : null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const clickedInsideMobileCategory =
        mobileCategoryMenuRef.current?.contains(event.target as Node) ||
        mobileCategoryButtonRef.current?.contains(event.target as Node);
      const clickedInsideDesktopCategory =
        desktopCategoryMenuRef.current?.contains(event.target as Node) ||
        desktopCategoryButtonRef.current?.contains(event.target as Node);

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

  function updateCategoryMenuPosition() {
    const isDesktop = window.innerWidth >= 1024;
    const button = isDesktop
      ? desktopCategoryButtonRef.current
      : mobileCategoryButtonRef.current;

    if (!button) {
      setCategoryMenuOpen(false);
      return;
    }

    const rect = button.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setCategoryMenuOpen(false);
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom - 20;
    const maxHeight = Math.max(Math.min(spaceBelow, 460), 260);
    const horizontalMargin = 16;
    const mobileToolbarRect = mobileToolbarRef.current?.getBoundingClientRect();
    const mobileWidth = Math.min(
      Math.max(mobileToolbarRect?.width ?? rect.width, 280),
      viewportWidth - horizontalMargin * 2,
    );
    const desktopWidth = Math.min(
      Math.max(rect.width, 440),
      viewportWidth - horizontalMargin * 2,
    );
    const width = isDesktop ? desktopWidth : mobileWidth;
    const left = isDesktop
      ? rect.left
      : Math.min(
          Math.max(mobileToolbarRect?.left ?? rect.left, horizontalMargin),
          viewportWidth - width - horizontalMargin,
        );

    setCategoryDropdownPos({
      top: rect.bottom + 12,
      left,
      width,
      maxHeight,
    });
  }

  function openCategoryMenu() {
    if (!categoryMenuOpen) {
      updateCategoryMenuPosition();
    }

    setCategoryMenuOpen((open) => !open);
  }

  useEffect(() => {
    if (!categoryMenuOpen) return;

    const handleViewportChange = () => {
      updateCategoryMenuPosition();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [categoryMenuOpen]);

  const categoryDropdownContent = (
    <div
      ref={
        typeof window !== "undefined" && window.innerWidth >= 1024
          ? desktopCategoryMenuRef
          : mobileCategoryMenuRef
      }
      style={{
        position: "fixed",
        top: `${categoryDropdownPos.top}px`,
        left: `${categoryDropdownPos.left}px`,
        width: `${categoryDropdownPos.width}px`,
        zIndex: 9999,
      }}
      className="overflow-hidden rounded-[24px] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,12,18,0.985),rgba(5,8,15,0.985))] p-2 shadow-[0_34px_90px_-34px_rgba(0,0,0,0.92),0_0_0_1px_rgba(255,255,255,0.04),0_0_34px_rgba(34,211,238,0.08)] backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between px-2 pt-1">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            เลือกหมวดหมู่
          </p>
          <p className="mt-1 text-[11px] text-cyan-100/60">
            {categorySection} · {sectionCategories.length} ตัวเลือก
          </p>
        </div>
        <p className="text-[11px] text-cyan-100/60">
          {activeCategorySummary?.count ?? 0} ไฟล์
        </p>
      </div>

      <div className="mb-2.5 grid grid-cols-4 gap-1.5 px-2 sm:gap-2">
        {CATEGORY_SECTION_NAMES.map((section) => (
          <SectionSwitchButton
            key={section}
            active={section === categorySection}
            label={section}
            onClick={() => setCategorySection(section)}
          />
        ))}
      </div>

      <div
        role="listbox"
        className="space-y-1.5 overflow-y-auto px-2 pb-2"
        style={{ maxHeight: `${categoryDropdownPos.maxHeight}px` }}
      >
        <CategoryFilterOption
          active={activeCategory === createSectionFilterValue(categorySection)}
          count={sectionCountMap.get(categorySection) ?? 0}
          label="ทั้งหมด"
          accentSection={categorySection}
          sectionLabel={categorySection === "ALL" ? "ALL" : `${categorySection} ทั้งหมด`}
          onClick={() => {
            onSetActiveCategory(createSectionFilterValue(categorySection));
            setCategoryMenuOpen(false);
          }}
        />
        {orderedSectionCategories.map((category) => (
          <CategoryFilterOption
            key={category}
            active={activeCategory === category}
            count={categoryCountMap.get(category) ?? 0}
            label={category}
            sectionLabel={getCategorySection(category) ?? categorySection}
            onClick={() => {
              onSetActiveCategory(category);
              setCategoryMenuOpen(false);
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
      <Card
        id="library"
        className="scroll-mt-16.5 w-full min-w-0 overflow-visible rounded-[32px]"
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

              <div className="w-full lg:flex lg:w-full lg:max-w-[44rem] lg:justify-end">
                <div className={categoryMenuOpen ? "relative z-40 lg:hidden" : "lg:hidden"}>
                  <div
                    ref={mobileToolbarRef}
                    className="flex items-stretch gap-2 sm:gap-3"
                  >
                    <button
                      ref={mobileCategoryButtonRef}
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={categoryMenuOpen}
                      aria-label="เลือกหมวดหมู่ในคลัง"
                      onClick={() => openCategoryMenu()}
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
                </div>

                <div className="hidden w-full items-center gap-3 lg:flex">
                  <div
                    className={`w-[17.5rem] shrink-0 ${categoryMenuOpen ? "relative z-40" : ""}`}
                  >
                    <div className="relative">
                      <button
                        ref={desktopCategoryButtonRef}
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={categoryMenuOpen}
                        aria-label="เลือกหมวดหมู่ในคลัง"
                        onClick={() => openCategoryMenu()}
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
                              {activeCategory === "all"
                                ? `${activeCategorySummary?.count ?? 0} ไฟล์`
                                : `${activeSectionFilter ?? getCategorySection(activeCategory) ?? categorySection} · ${activeCategorySummary?.count ?? 0} ไฟล์`}
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

                    </div>
                  </div>

                  <div className="relative min-w-[4.5rem] flex-1">
                    <Icon
                      name="search"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                    />
                    <Input
                      value={search}
                      onChange={(event) => onSearchChange(event.target.value)}
                      placeholder="ค้นหา..."
                      className="h-12 min-w-0 rounded-full border-white/12 bg-white/[0.04] pl-11"
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
                          <Icon
                            name="settings"
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                          />
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
                            <span className="inline-flex items-center gap-2 font-medium">
                              <Icon
                                name={allVisibleSelected ? "x" : "check"}
                                className="h-4 w-4"
                              />
                              {allVisibleSelected
                                ? "ยกเลิกเลือกทั้งหมดในหน้านี้"
                                : "เลือกทั้งหมดในหน้านี้"}
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

              <div className="grid items-start grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-3 lg:grid-cols-5">
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
                      กำลังดูไฟล์ {pageStart}-{pageEnd} จากทั้งหมด{" "}
                      {filteredItems.length} ไฟล์
                    </p>
                  </div>

                  <div className="w-full md:hidden">
                    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                      {pageNumbers.map((page, index) => {
                        const previousPage = pageNumbers[index - 1];
                        const showGap =
                          index > 0 && previousPage && page - previousPage > 1;

                        return (
                          <div
                            key={page}
                            className="flex shrink-0 items-center gap-2"
                          >
                            {showGap ? (
                              <span className="px-1 text-sm text-zinc-500">
                                ...
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onPageChange(page)}
                              className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border px-3 text-sm font-medium transition-all ${
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

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onPageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-200 transition-all hover:border-cyan-300/20 hover:bg-cyan-400/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
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

                      <button
                        type="button"
                        onClick={() =>
                          onPageChange(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-200 transition-all hover:border-cyan-300/20 hover:bg-cyan-400/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
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

                  <div className="hidden md:flex md:items-center md:justify-end md:gap-2">
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
      {mounted && categoryMenuOpen && createPortal(categoryDropdownContent, document.body)}
    </>
  );
}

function CategoryFilterOption({
  accentSection,
  active,
  count,
  label,
  onClick,
  sectionLabel,
}: {
  accentSection?: CategorySection;
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  sectionLabel?: string;
}) {
  const normalizedSection =
    sectionLabel === "CGM48" || sectionLabel === "BNK48" || sectionLabel === "OTHER"
      ? sectionLabel
      : null;
  const accent = getSectionAccentClass(accentSection ?? normalizedSection ?? "OTHER");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-[18px] border px-4 py-2.5 text-left text-sm transition-all ${
        active
          ? accent.option
          : "border-white/8 bg-white/[0.025] text-zinc-300 hover:border-cyan-300/16 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          active
            ? accent.rail
            : "bg-transparent"
        }`}
      />
      <span className="block pr-14">
        {sectionLabel ? (
          <span className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/45">
            {sectionLabel}
          </span>
        ) : null}
        <span className="mt-0.5 block font-medium tracking-[0.08em]">{label}</span>
        <span className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-400">
          {count} ไฟล์
        </span>
      </span>
      <span
        className={`pointer-events-none absolute bottom-2.5 right-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
          active
            ? accent.dot
            : "border-white/10 bg-white/[0.04] text-zinc-500"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            active ? "bg-current shadow-[0_0_18px_currentColor]" : "border border-current"
          }`}
        />
      </span>
    </button>
  );
}

function SectionSwitchButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: CategorySection;
  onClick: () => void;
}) {
  const accent = getSectionAccentClass(label);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-[16px] border px-1.5 py-2 text-center transition-all duration-200 sm:rounded-[18px] sm:px-3 ${
        active
          ? accent.tab
          : "border-white/8 bg-white/[0.03] text-zinc-300 hover:border-cyan-300/18 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <p className="whitespace-nowrap text-[12px] font-semibold tracking-[0.02em] sm:text-sm sm:tracking-[0.04em]">
        {label}
      </p>
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
      className={`group relative self-start overflow-hidden rounded-[22px] border transition-all duration-200 sm:rounded-[24px] xl:rounded-[28px] ${
        isSelected
          ? "border-cyan-300/35 bg-cyan-400/[0.08] shadow-[0_22px_50px_-28px_rgba(34,211,238,0.55)]"
          : "border-white/8 bg-black/18 hover:border-cyan-300/20 hover:bg-white/[0.03]"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {canManageDrive ? (
        <>
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

          <button
            type="button"
            onClick={() => onDeleteItem(item)}
            disabled={isBusy}
            className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-400/18 bg-rose-400/12 text-rose-100 backdrop-blur-md transition-all hover:border-rose-400/30 hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-60 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
            aria-label={`ลบ ${item.fileName}`}
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </>
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
            {previewKind === "video" ? (
              <VideoThumbnail item={item} />
            ) : (
              <>
                {/* biome-ignore lint/performance/noImgElement: thumbnail preview is proxied from a protected route */}
                <img
                  src={`/api/media/${item.id}/thumbnail`}
                  alt={item.fileName}
                  className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </>
            )}
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

      <div className="space-y-1.5 px-3 pb-1.5 pt-2.5 sm:space-y-2 sm:px-3.5 sm:pb-2 sm:pt-3 md:space-y-2.5 md:px-4 md:pb-2.5 md:pt-3.5 lg:space-y-3 lg:pb-3.5 lg:pt-4">
        <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5 lg:space-y-2">
          <h3
            className="truncate text-sm font-semibold text-white sm:text-base"
            title={item.fileName}
          >
            {item.fileName}
          </h3>
          <p className="truncate text-[10px] leading-4 text-zinc-400 sm:text-[11px] sm:leading-4 md:text-sm">
            @{item.uploaderUsername}
          </p>
          <p className="text-[10px] leading-4 text-zinc-500 sm:text-[11px] sm:leading-4 md:text-xs">
            <span className="whitespace-nowrap text-[10px] sm:hidden">
              {formatDateCompact(item.createdAt)}
            </span>
            <span className="hidden sm:inline">
              {formatDate(item.createdAt)}
            </span>
          </p>
        </div>

        <p className="hidden text-sm leading-5 text-zinc-400 lg:block">
          {item.description || "ไม่มีโน้ตประกอบไฟล์นี้"}
        </p>
      </div>
    </div>
  );
}

function VideoThumbnail({ item }: { item: MediaItem }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(
    videoThumbnailCache.get(item.id) ?? null,
  );

  useEffect(() => {
    if (thumbnailSrc) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "240px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [thumbnailSrc]);

  useEffect(() => {
    if (!isVisible || thumbnailSrc) return;

    let cancelled = false;
    const video = document.createElement("video");

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = `/api/media/${item.id}/content`;

    const cleanup = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };

    const captureFrame = () => {
      if (cancelled || !video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        videoThumbnailCache.set(item.id, dataUrl);
        if (!cancelled) {
          setThumbnailSrc(dataUrl);
        }
      } catch {}
    };

    const handleLoadedData = () => {
      const seekTime =
        Number.isFinite(video.duration) && video.duration > 0.4
          ? Math.min(0.35, video.duration / 3)
          : 0;

      if (seekTime <= 0) {
        captureFrame();
        return;
      }

      try {
        video.currentTime = seekTime;
      } catch {
        captureFrame();
      }
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("seeked", captureFrame, { once: true });
    video.addEventListener("error", cleanup, { once: true });

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("seeked", captureFrame);
      cleanup();
    };
  }, [isVisible, item.id, thumbnailSrc]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {/* biome-ignore lint/performance/noImgElement: thumbnail preview is proxied from a protected route */}
      <img
        src={thumbnailSrc ?? `/api/media/${item.id}/thumbnail`}
        alt={item.fileName}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </div>
  );
}
