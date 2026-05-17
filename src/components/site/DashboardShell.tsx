"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaItem } from "@/lib/media";
import { UploadForm } from "./UploadForm";

type CategorySummary = {
  name: string;
  count: number;
};

type MemberSummary = {
  name: string;
  uploads: number;
};

function mediaIconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "folder";
}

export function DashboardShell({
  canManageDrive,
  driveAccountEmail,
  driveConnected,
  items,
  totalBytes,
  totalItems,
  categories,
  topMembers,
}: {
  canManageDrive: boolean;
  driveAccountEmail: string | null;
  driveConnected: boolean;
  items: MediaItem[];
  totalBytes: number;
  totalItems: number;
  categories: CategorySummary[];
  topMembers: MemberSummary[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const deferredSearch = useDeferredValue(search);

  const filteredItems = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const haystack =
        `${item.fileName} ${item.description ?? ""} ${item.uploaderName}`.toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearch, items]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 pb-16">
      {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
      <section id="overview" className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              storage pulse
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {formatBytes(totalBytes)}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
              Total known size across every file already indexed in Google
              Drive.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              uploads
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {totalItems}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              items in the gang vault
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              categories
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {categories.length}
            </p>
            <p className="mt-2 text-sm text-zinc-400">active content buckets</p>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
        <Card id="library">
          <CardHeader className="border-b border-white/8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  media library
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Browse everything the gang has uploaded
                </h2>
              </div>
              <div className="relative lg:w-80">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search files, notes, members"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  activeCategory === "all"
                    ? "bg-white text-slate-950"
                    : "bg-white/6 text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                all
              </button>
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setActiveCategory(category.name)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    activeCategory === category.name
                      ? "bg-white text-slate-950"
                      : "bg-white/6 text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category.name} · {category.count}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardBody className="pt-6">
            <div className="grid gap-4">
              {filteredItems.length ? (
                filteredItems.map((item) => (
                  <a
                    key={item.id}
                    href={`/api/media/${item.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-[24px] border border-white/8 bg-black/15 p-4 transition-all hover:border-cyan-300/30 hover:bg-black/25"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/15 to-blue-500/15 text-cyan-200 ring-1 ring-inset ring-white/10">
                          <Icon
                            name={mediaIconForMime(item.mimeType)}
                            className="h-5 w-5"
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-medium text-white">
                              {item.fileName}
                            </h3>
                            <Badge>{item.category}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">
                            Uploaded by {item.uploaderName} ·{" "}
                            {formatDate(item.createdAt)}
                          </p>
                          <p className="mt-2 text-sm text-zinc-500">
                            {item.description || "No note attached"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-sm text-zinc-400 sm:items-end">
                        <span>{formatBytes(item.fileSize)}</span>
                        <span className="rounded-full bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {item.mimeType.split("/")[0]}
                        </span>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/12 bg-black/10 px-6 py-10 text-center text-sm text-zinc-500">
                  ยังไม่เจอไฟล์ตาม filter นี้ ลองเปลี่ยน category หรือคำค้นดูครับ
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6">
          {/* biome-ignore lint/correctness/useUniqueElementIds: top-level page anchor */}
          <Card id="upload">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                quick upload
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Push new files into Drive
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                เลือกไฟล์ ใส่หมวดหมู่ แล้วระบบจะอัปโหลดขึ้น Google Drive พร้อมเก็บ metadata
                ว่าใครเป็นคนอัปโหลด
              </p>
            </CardHeader>
            <CardBody>
              {driveConnected ? (
                <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  Connected to Google Drive
                  {driveAccountEmail ? ` as ${driveAccountEmail}` : ""}.
                </div>
              ) : canManageDrive ? (
                <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Google Drive owner account is not connected yet.
                  <a
                    href="/api/google-drive/oauth/start"
                    className="ml-2 font-medium text-cyan-200 underline underline-offset-4"
                  >
                    Connect now
                  </a>
                </div>
              ) : (
                <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Waiting for an admin to connect the owner Google Drive
                  account.
                </div>
              )}
              <UploadForm />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                category heat
              </p>
              <div className="mt-4 space-y-3">
                {categories.length ? (
                  categories.map((category) => (
                    <div key={category.name}>
                      <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                        <span>{category.name}</span>
                        <span>{category.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/6">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500"
                          style={{
                            width: `${Math.max(
                              10,
                              (category.count /
                                Math.max(categories[0]?.count ?? 1, 1)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No uploads yet.</p>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                top contributors
              </p>
              <div className="mt-4 space-y-3">
                {topMembers.length ? (
                  topMembers.map((member, index) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between rounded-2xl bg-black/15 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {index + 1}. {member.name}
                        </p>
                        <p className="text-xs text-zinc-500">member activity</p>
                      </div>
                      <span className="text-sm text-cyan-200">
                        {member.uploads} uploads
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    No member activity yet.
                  </p>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
