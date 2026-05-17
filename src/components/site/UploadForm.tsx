"use client";

import { useRouter } from "next/navigation";
import { startTransition, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { CATEGORIES } from "@/lib/media";

export function UploadForm({
  onUploaded,
  onCancel,
}: {
  onUploaded?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileId = useId();
  const categoryId = useId();
  const descriptionId = useId();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!file) {
      setError("เลือกไฟล์ก่อนอัปโหลด");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("category", category);
    formData.set("description", description);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage("อัปโหลดสำเร็จแล้ว ไฟล์ถูกส่งขึ้นคลาวด์เรียบร้อย");
      setDescription("");
      setFile(null);
      const input = form.elements.namedItem("file") as HTMLInputElement | null;
      if (input) input.value = "";
      startTransition(() => {
        router.refresh();
      });
      onUploaded?.();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "อัปโหลดไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-[28px] border border-white/8 bg-black/18 p-4">
        <label htmlFor={fileId} className="block">
          <span className="mb-3 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            file
          </span>
          <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] p-4 transition-all hover:border-cyan-300/20 hover:bg-white/[0.045]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/15 to-blue-500/15 text-cyan-200 ring-1 ring-inset ring-white/10">
                  <Icon name="upload" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {file ? file.name : "เลือกไฟล์ที่จะโยนขึ้น vault"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : "รูป วิดีโอ เอกสาร หรือไฟล์อื่นๆ จากในเครื่อง"}
                  </p>
                </div>
              </div>

              <span className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white/8 px-5 text-sm font-medium text-white transition-all hover:border-cyan-300/20 hover:bg-white/12">
                Choose file
              </span>
            </div>
          </div>
        </label>

        <Input
          id={fileId}
          name="file"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-black/18 p-4">
          <label
            htmlFor={categoryId}
            className="mb-3 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
          >
            category
          </label>
          <select
            id={categoryId}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-cyan-300/50 focus:bg-white/8"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item} className="bg-slate-950">
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-black/18 p-4">
          <label
            htmlFor={descriptionId}
            className="mb-3 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
          >
            note
          </label>
          <Input
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="เช่น afterparty raw clips / dump / reference"
            className="h-12"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-[22px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          ระบบจะบันทึกว่าไฟล์นี้อัปโดย user ที่กำลังล็อกอินอยู่
        </p>
        <div className="flex items-center gap-3">
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="h-12 px-5"
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={busy} className="h-12 min-w-44 px-6">
            {busy ? "Uploading..." : "Upload to Drive"}
            {!busy ? <Icon name="arrow-right" className="h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </form>
  );
}
