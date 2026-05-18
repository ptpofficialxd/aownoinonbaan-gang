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
  busyIdSet,
  canManageDrive,
  canUploadNow,
  dashboard,
  driveConnected,
  filteredItems,
  onClearSelection,
  onDeleteItem,
  onDeleteSelected,
  onOpenPreview,
  onSearchChange,
  onSelectAllVisible,
  onSetActiveCategory,
  onToggleSelect,
  onUploadOpen,
  search,
  selectedIds,
  selectedIdSet,
  visibleSelectedCount,
}: {
  activeCategory: string;
  busyIdSet: Set<string>;
  canManageDrive: boolean;
  canUploadNow: boolean;
  dashboard: DashboardSummary;
  driveConnected: boolean;
  filteredItems: MediaItem[];
  onClearSelection: () => void;
  onDeleteItem: (item: MediaItem) => void;
  onDeleteSelected: () => void;
  onOpenPreview: (item: MediaItem) => void;
  onSearchChange: (value: string) => void;
  onSelectAllVisible: () => void;
  onSetActiveCategory: (value: string) => void;
  onToggleSelect: (id: string) => void;
  onUploadOpen: () => void;
  search: string;
  selectedIds: string[];
  selectedIdSet: Set<string>;
  visibleSelectedCount: number;
}) {
  const isSystemReady = canUploadNow;

  return (
    <>
      {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
      <Card id="library" className="w-full min-w-0 rounded-[32px]">
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
                  แบ่งปันความน่ารักของสาวๆกันครัฟพี่
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
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="ค้นหาชื่อไฟล์ คนอัปโหลด หรือโน้ต"
                    className="h-12 rounded-full border-white/12 bg-white/[0.04] pl-11"
                  />
                </div>

                {canUploadNow ? (
                  <button
                    type="button"
                    onClick={onUploadOpen}
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
              <CategoryFilterChip
                active={activeCategory === "all"}
                count={dashboard.totalItems}
                label="ทั้งหมด"
                onClick={() => onSetActiveCategory("all")}
              />
              {dashboard.categories.map((category) => (
                <CategoryFilterChip
                  key={category.name}
                  active={activeCategory === category.name}
                  count={category.count}
                  label={category.name}
                  onClick={() => onSetActiveCategory(category.name)}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-6">
          {filteredItems.length ? (
            <div className="space-y-5">
              <div className="sticky top-4 z-10 overflow-hidden rounded-[22px] border border-white/10 bg-[#0d1016]/85 p-3 backdrop-blur-xl sm:rounded-[26px] sm:p-4">
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
                        onClick={onSelectAllVisible}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-all hover:border-white/15 hover:bg-white/[0.08] sm:h-10 sm:px-4 sm:text-sm"
                      >
                        เลือกทั้งหมดที่เห็น
                      </button>
                      <button
                        type="button"
                        onClick={onClearSelection}
                        disabled={selectedIds.length === 0}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-all hover:border-white/15 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-4 sm:text-sm"
                      >
                        ล้างการเลือก
                      </button>
                      <button
                        type="button"
                        onClick={onDeleteSelected}
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
                {filteredItems.map((item) => (
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

function CategoryFilterChip({
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
      className={`rounded-full border px-4 py-2 text-sm transition-all ${
        active
          ? "border-cyan-300/30 bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_14px_35px_-18px_rgba(34,211,238,0.7)]"
          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/15 hover:bg-white/8 hover:text-white"
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
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
