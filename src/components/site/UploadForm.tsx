"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { CATEGORIES, type MediaItem } from "@/lib/media";

export function UploadForm({
  onUploaded,
}: {
  onUploaded?: (items: MediaItem[]) => void;
}) {
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<
    "idle" | "preparing" | "uploading" | "finalizing"
  >("idle");
  const [uploadCount, setUploadCount] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileId = useId();
  const categoryId = useId();
  const descriptionId = useId();
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!categoryMenuRef.current?.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategoryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function uploadSingleFile(input: {
    file: File;
    category: string;
    description: string;
    fileIndex: number;
    totalFiles: number;
  }) {
    const formData = new FormData();
    formData.set("file", input.file);
    formData.set("category", input.category);
    formData.set("description", input.description);

    return new Promise<MediaItem | null>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/media/upload", true);

      xhr.upload.onprogress = (uploadEvent) => {
        if (!uploadEvent.lengthComputable) return;
        const ratio = uploadEvent.total
          ? uploadEvent.loaded / uploadEvent.total
          : 0;
        const currentProgress = Math.round(ratio * 100);
        const overallProgress = Math.round(
          ((input.fileIndex + currentProgress / 100) / input.totalFiles) * 100,
        );
        setProgress(Math.max(3, Math.min(97, overallProgress)));
      };

      xhr.onerror = () => {
        reject(new Error(`Network Error: อัปโหลดไฟล์ ${input.file.name} ไม่สำเร็จ`));
      };

      xhr.onload = () => {
        let payload: { error?: string; mediaItem?: MediaItem | null } = {};
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {}

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new Error(payload.error || `อัปโหลดไฟล์ ${input.file.name} ไม่สำเร็จ`),
          );
          return;
        }

        resolve(payload.mediaItem ?? null);
      };

      xhr.send(formData);
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!files.length) {
      setError("เลือกไฟล์ก่อนทำการอัปโหลด");
      return;
    }
    if (!category) {
      setError("เลือกหมวดหมู่ก่อนทำการอัปโหลด");
      return;
    }

    setBusy(true);
    setProgress(0);
    setPhase("preparing");
    setUploadCount(files.length);
    setCurrentUploadIndex(0);
    setCurrentFileName("");
    setError(null);
    setMessage(null);

    try {
      setPhase("uploading");
      const uploadedItems: MediaItem[] = [];

      for (const [index, file] of files.entries()) {
        setCurrentUploadIndex(index + 1);
        setCurrentFileName(file.name);
        const uploadedItem = await uploadSingleFile({
          file,
          category,
          description,
          fileIndex: index,
          totalFiles: files.length,
        });

        if (uploadedItem) {
          uploadedItems.push(uploadedItem);
        }
      }

      setPhase("finalizing");
      setProgress(97);

      setProgress(100);
      setMessage(
        files.length > 1
          ? `อัปโหลดสำเร็จ ${files.length} ไฟล์แล้ว ไฟล์ทั้งหมดถูกส่งขึ้นคลาวด์เรียบร้อย`
          : "อัปโหลดสำเร็จแล้ว ไฟล์ถูกส่งขึ้นคลาวด์เรียบร้อย",
      );
      setDescription("");
      setFiles([]);
      const input = form.elements.namedItem("file") as HTMLInputElement | null;
      if (input) input.value = "";
      onUploaded?.(uploadedItems);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "อัปโหลดไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
      setPhase("idle");
      setCurrentUploadIndex(0);
      setCurrentFileName("");
    }
  }

  const progressLabel =
    phase === "preparing"
      ? "กำลังเตรียมการอัปโหลด"
      : phase === "uploading"
        ? `กำลังอัปโหลด ${currentUploadIndex}/${uploadCount || files.length} ไฟล์`
        : phase === "finalizing"
          ? "กำลังบันทึกไฟล์เข้าระบบ"
          : null;

  const fieldShellClass =
    "group flex h-14 w-full items-center justify-between rounded-[22px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-4 text-left text-white ring-1 ring-inset ring-white/8 transition-all duration-200 hover:border-cyan-300/26 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))]";
  const fieldLeadingIconClass =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-100 ring-1 ring-inset ring-cyan-200/10";
  const fieldEyebrowClass =
    "text-[11px] uppercase tracking-[0.24em] text-cyan-100/48";
  const fieldValueClass =
    "block w-full text-sm font-medium leading-tight tracking-[0.08em] text-white";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-[28px] border border-white/8 bg-black/18 p-4">
        <label htmlFor={fileId} className="block">
          <span className="mb-3 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            ไฟล์
          </span>
          <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] p-4 transition-all hover:border-cyan-300/20 hover:bg-white/[0.045]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/15 to-blue-500/15 text-cyan-200 ring-1 ring-inset ring-white/10">
                  <Icon name="upload" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {files.length
                      ? files.length === 1
                        ? files[0]?.name
                        : `เลือกแล้ว ${files.length} ไฟล์`
                      : "เลือกไฟล์ที่ต้องการอัปโหลด"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {files.length
                      ? `${(
                          files.reduce((sum, item) => sum + item.size, 0) /
                          1024 /
                          1024
                        ).toFixed(2)} MB`
                      : "รูปภาพ วิดีโอ เอกสาร หรือไฟล์อื่นๆ"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </label>

        <Input
          id={fileId}
          name="file"
          type="file"
          multiple
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
            setError(null);
          }}
          className="sr-only"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-black/18 p-4">
          <label
            htmlFor={categoryId}
            className="mb-3 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
          >
            หมวดหมู่
          </label>
          <div ref={categoryMenuRef} className="relative">
            <button
              id={categoryId}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={categoryMenuOpen}
              aria-label="เลือกหมวดหมู่"
              onClick={() => setCategoryMenuOpen((open) => !open)}
              className={`${fieldShellClass} shadow-[0_18px_40px_-28px_rgba(34,211,238,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={fieldLeadingIconClass}>
                  <Icon name="heart" className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className={fieldEyebrowClass}>เมมเบอร์</p>
                  <p
                    className={`${fieldValueClass} truncate ${
                      category ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {category || "เลือกหมวดหมู่"}
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
              className={`absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-30 overflow-hidden rounded-[24px] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,12,18,0.98),rgba(5,8,15,0.98))] p-2 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04),0_0_36px_rgba(34,211,238,0.08)] backdrop-blur-xl transition-all duration-200 ${
                categoryMenuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-2 pt-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  เลือกหมวดหมู่
                </p>
                <p className="text-[11px] text-cyan-100/60">
                  {CATEGORIES.length} ตัวเลือก
                </p>
              </div>

              <div
                role="listbox"
                aria-labelledby={categoryId}
                className="max-h-80 space-y-1 overflow-y-auto pr-1"
              >
                {CATEGORIES.map((item) => {
                  const selected = item === category;

                  return (
                    <button
                      key={item}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setCategory(item);
                        setCategoryMenuOpen(false);
                        setError(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left text-sm transition-all duration-150 ${
                        selected
                          ? "bg-[linear-gradient(90deg,rgba(34,211,238,0.2),rgba(59,130,246,0.08))] text-white ring-1 ring-inset ring-cyan-300/26"
                          : "text-zinc-300 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className="font-medium tracking-[0.08em]">
                        {item}
                      </span>
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                          selected
                            ? "bg-cyan-300/16 text-cyan-100"
                            : "text-transparent"
                        }`}
                      >
                        <Icon name="check" className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-black/18 p-4">
          <label
            htmlFor={descriptionId}
            className="mb-3 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
          >
            โน้ต
          </label>
          <div
            className={`${fieldShellClass} shadow-[0_18px_40px_-28px_rgba(34,211,238,0.28)] focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-300/40`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`${fieldLeadingIconClass} pointer-events-none`}
              >
                <Icon name="hash" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`${fieldEyebrowClass} pointer-events-none`}>
                  เพิ่มเติม
                </p>
                <input
                  id={descriptionId}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="เพิ่มโน้ตสั้นๆ เกี่ยวกับไฟล์นี้"
                  className={`${fieldValueClass} border-0 bg-transparent p-0 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p className="flex items-center gap-2 rounded-[22px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-300" />
          <span>{error}</span>
        </p>
      ) : null}

      {message ? (
        <p className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      {busy ? (
        <div className="rounded-[24px] border border-cyan-300/16 bg-gradient-to-br from-cyan-400/10 via-sky-400/8 to-blue-500/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                {progressLabel ?? "กำลังอัปโหลด"}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-100/70">
                {currentFileName || "รอแปปนึงนะงื้อออออ"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-cyan-100">
                {progress}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8 ring-1 ring-inset ring-white/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(103,232,249,0.95),rgba(34,211,238,0.95),rgba(59,130,246,0.95))] shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p className="text-sm text-zinc-500">ระบบจะบันทึกว่าไฟล์นี้ถูกอัปโหลดโดยคุณ</p>
        <div className="flex items-center justify-center sm:justify-end">
          <Button
            type="submit"
            disabled={busy}
            className="group relative h-12 min-w-34 overflow-hidden rounded-full border border-cyan-200/16 bg-[linear-gradient(180deg,rgba(82,221,248,0.98),rgba(24,190,234,0.94))] px-4 text-zinc-950 shadow-[0_18px_36px_-18px_rgba(34,211,238,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-100/24 hover:shadow-[0_22px_42px_-18px_rgba(34,211,238,0.82)] disabled:translate-y-0 disabled:border-cyan-200/10 disabled:bg-[linear-gradient(180deg,rgba(82,221,248,0.52),rgba(24,190,234,0.45))] disabled:text-zinc-900/65 disabled:shadow-[0_14px_28px_-22px_rgba(34,211,238,0.45)]"
          >
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),transparent_55%)] opacity-80" />
            <span className="relative flex items-center gap-3">
              <span className="text-sm font-semibold tracking-[0.08em] text-zinc-950">
                {busy ? "Uploading..." : "อัปโหลด"}
              </span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-zinc-950 transition-transform duration-200 group-hover:translate-x-0.5">
                <Icon
                  name={busy ? "upload" : "arrow-right"}
                  className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`}
                />
              </span>
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}
