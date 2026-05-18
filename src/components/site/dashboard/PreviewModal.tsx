import { Icon } from "@/components/ui/Icon";
import type { MediaItem } from "@/lib/media";
import { getPreviewHint, getPreviewKind } from "./utils";

export function PreviewModal({
  onClose,
  previewItem,
  previewText,
  previewTextError,
  previewTextLoading,
}: {
  onClose: () => void;
  previewItem: MediaItem | null;
  previewText: string;
  previewTextError: string | null;
  previewTextLoading: boolean;
}) {
  if (!previewItem) return null;

  const previewKind = getPreviewKind(previewItem.mimeType);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/72 p-3 backdrop-blur-2xl sm:p-5">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.16) 0, rgba(56,189,248,0.06) 18%, transparent 38%), radial-gradient(circle at 80% 14%, rgba(244,114,182,0.14) 0, rgba(244,114,182,0.05) 16%, transparent 36%), radial-gradient(circle at 50% 100%, rgba(34,211,238,0.12) 0, rgba(34,211,238,0.04) 20%, transparent 42%)",
        }}
      />
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/14 bg-white/[0.075] shadow-[0_50px_160px_-44px_rgba(0,0,0,0.9)] ring-1 ring-white/8">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 18%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.03) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 bg-black/12 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white sm:text-base">
              {previewItem.fileName}
            </p>
            <p className="mt-1 text-xs text-zinc-300/80 sm:text-sm">
              {getPreviewHint(previewItem.mimeType)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/[0.08] text-zinc-200 shadow-[0_12px_30px_-18px_rgba(255,255,255,0.45)_inset,0_10px_30px_-18px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all hover:border-white/22 hover:bg-white/[0.14] hover:text-white"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="relative overflow-auto bg-black/10 p-3 sm:p-5">
          <div className="flex min-h-[40vh] items-center justify-center rounded-[28px] border border-white/10 bg-black/18 p-3 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] backdrop-blur-xl sm:p-4">
            {previewKind === "image" ? (
              <>
                {/* biome-ignore lint/performance/noImgElement: authenticated media preview must remain directly savable from the lightbox */}
                <img
                  src={`/api/media/${previewItem.id}/content`}
                  alt={previewItem.fileName}
                  className="max-h-[76vh] w-auto max-w-full rounded-[24px] border border-white/10 object-contain shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] select-auto"
                />
              </>
            ) : previewKind === "video" ? (
              <>
                {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded preview media does not include caption tracks */}
                <video
                  src={`/api/media/${previewItem.id}/content`}
                  controls
                  className="max-h-[76vh] w-auto max-w-full rounded-[24px] border border-white/10 bg-black object-contain shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]"
                />
              </>
            ) : previewKind === "audio" ? (
              <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-10 text-center">
                <div className="inline-flex h-18 w-18 items-center justify-center rounded-[28px] border border-cyan-300/16 bg-cyan-300/10 text-cyan-100 shadow-[0_20px_50px_-28px_rgba(34,211,238,0.45)]">
                  <Icon name="video" className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    ตัวอย่างไฟล์เสียง
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    เล่นตัวอย่างได้ทันทีใน popup นี้
                  </p>
                </div>
                {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded preview media does not include caption tracks */}
                <audio
                  src={`/api/media/${previewItem.id}/content`}
                  controls
                  className="w-full max-w-xl"
                />
              </div>
            ) : previewKind === "pdf" ? (
              <iframe
                src={`/api/media/${previewItem.id}/content`}
                title={previewItem.fileName}
                className="h-[76vh] w-full rounded-[24px] border border-white/10 bg-white"
              />
            ) : previewKind === "text" ? (
              <div className="w-full max-w-4xl overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0f15]/90 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
                <div className="border-b border-white/8 px-5 py-3">
                  <p className="text-sm font-medium text-white">พรีวิวข้อความ</p>
                </div>
                <div className="max-h-[72vh] overflow-auto px-5 py-4">
                  {previewTextLoading ? (
                    <p className="text-sm text-zinc-400">กำลังโหลดข้อความ...</p>
                  ) : previewTextError ? (
                    <p className="text-sm text-rose-300">{previewTextError}</p>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">
                      {previewText || "ไฟล์นี้ไม่มีข้อความสำหรับแสดงตัวอย่าง"}
                    </pre>
                  )}
                </div>
              </div>
            ) : previewKind === "document" ? (
              <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
                <div className="border-b border-white/8 px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-indigo-300/20 bg-indigo-400/12 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-indigo-100">
                      DOC PREVIEW
                    </span>
                    <span className="text-xs text-zinc-400">
                      เนื้อหาไฟล์ Word ยังไม่ถูกเรนเดอร์โดยตรง
                    </span>
                  </div>
                </div>
                <div className="space-y-5 px-6 py-6">
                  <div className="rounded-[24px] border border-white/10 bg-[#f8faff] p-5 text-slate-900">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-white">
                        DOC
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        DOCUMENT
                      </span>
                    </div>
                    <div className="mt-5 h-3 w-2/3 rounded-full bg-slate-900/85" />
                    <div className="mt-4 space-y-2.5">
                      <div className="h-2 w-full rounded-full bg-slate-300/90" />
                      <div className="h-2 w-11/12 rounded-full bg-slate-300/85" />
                      <div className="h-2 w-10/12 rounded-full bg-slate-300/80" />
                      <div className="h-2 w-8/12 rounded-full bg-slate-300/75" />
                      <div className="h-2 w-7/12 rounded-full bg-slate-200/90" />
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-zinc-300">
                    ตอนนี้ระบบทำ thumbnail และ document cover ให้แล้ว แต่ browser
                    ยังไม่สามารถเรนเดอร์เนื้อหา DOC/DOCX ตรงๆ ได้เหมือน PDF
                    หากต้องการอ่านไฟล์เต็ม แนะนำให้ดาวน์โหลดหรือเปิดด้วยโปรแกรมเอกสาร
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
