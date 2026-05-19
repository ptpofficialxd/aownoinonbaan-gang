import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { MediaItem } from "@/lib/media";
import { UploadForm } from "../UploadForm";

export function UploadModal({
  onClose,
  onUploaded,
  open,
}: {
  onClose: () => void;
  onUploaded: (items: MediaItem[]) => void;
  open: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto px-3 pb-[calc(0.75rem+var(--safe-area-bottom))] pt-[calc(0.75rem+var(--safe-area-top))] sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close upload modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative z-10 flex max-h-[calc(100dvh-1.5rem-var(--safe-area-top)-var(--safe-area-bottom))] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#101116] shadow-[0_40px_120px_-50px_rgba(0,0,0,0.85)] sm:max-h-[calc(100dvh-2rem-var(--safe-area-top)-var(--safe-area-bottom))]">
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
                แบ่งปันความน่ารักของสาวๆกันครัฟเพ่
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-7">
          <UploadForm onUploaded={onUploaded} />
        </div>
      </div>
    </div>
  );
}
