"use client";

import { useRouter } from "next/navigation";
import { startTransition, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CATEGORIES } from "@/lib/media";

export function UploadForm() {
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
      const input = event.currentTarget.elements.namedItem(
        "file",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      startTransition(() => {
        router.refresh();
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "อัปโหลดไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor={fileId}
          className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
        >
          file
        </label>
        <Input
          id={fileId}
          name="file"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={categoryId}
            className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
          >
            category
          </label>
          <select
            id={categoryId}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item} className="bg-slate-950">
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={descriptionId}
            className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
          >
            note
          </label>
          <Input
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="เช่น afterparty raw clips"
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? "Uploading..." : "Upload to Drive"}
      </Button>
    </form>
  );
}
