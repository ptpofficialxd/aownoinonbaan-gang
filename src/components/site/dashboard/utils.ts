import type { MediaItem } from "@/lib/media";
import type { DashboardSummary } from "./types";

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toLowerCase() ?? "";
  return extension && extension !== fileName.toLowerCase() ? extension : "";
}

function addAliasSet(target: Set<string>, values: string[]) {
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (normalized) {
      target.add(normalized);
    }
  }
}

export function mediaIconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "folder";
}

export function getMimeBadgeLabel(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return mimeType === "image/jpeg"
      ? "JPG"
      : (mimeType.split("/")[1]?.toUpperCase() ?? "IMG");
  }

  if (mimeType.startsWith("video/")) return "VDO";
  if (mimeType.startsWith("audio/")) return "AUD";
  if (mimeType.startsWith("text/")) return "TXT";
  if (mimeType === "application/pdf") return "PDF";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOC";
  }
  if (mimeType.startsWith("application/")) return "FILE";
  return mimeType.split("/")[0].toUpperCase();
}

export function getPreviewKind(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }
  if (mimeType.startsWith("text/")) return "text";
  return null;
}

export function isPreviewableFile(mimeType: string) {
  return getPreviewKind(mimeType) !== null;
}

export function getPreviewHint(mimeType: string) {
  const previewKind = getPreviewKind(mimeType);
  if (previewKind === "image") {
    return "Preview รูปภาพ";
  }
  if (previewKind === "video" || previewKind === "audio") {
    return "Preview วิดีโอ";
  }
  if (previewKind === "pdf") {
    return "Preview เอกสาร PDF";
  }
  if (previewKind === "text") {
    return "Preview เนื้อหาในไฟล์";
  }
  if (previewKind === "document") {
    return "แสดง document cover สำหรับไฟล์เอกสารชนิดนี้";
  }
  return "เปิดดูไฟล์ได้ใน popup นี้";
}

export function buildMediaSearchText(item: MediaItem) {
  const normalizedMimeType = item.mimeType.trim().toLowerCase();
  const [mimeGroup = "", mimeSubtype = ""] = normalizedMimeType.split("/");
  const extension = getFileExtension(item.fileName);
  const badgeLabel = getMimeBadgeLabel(item.mimeType).toLowerCase();
  const previewKind = getPreviewKind(item.mimeType);
  const aliases = new Set<string>();

  addAliasSet(aliases, [
    normalizedMimeType,
    mimeGroup,
    mimeSubtype,
    mimeSubtype.replace(/[.+-]/g, " "),
    badgeLabel,
    extension,
  ]);

  if (previewKind) {
    addAliasSet(aliases, [previewKind]);
  }

  if (mimeGroup === "image") {
    addAliasSet(aliases, [
      "image",
      "images",
      "photo",
      "photos",
      "picture",
      "pictures",
      "img",
    ]);
  }

  if (mimeGroup === "video") {
    addAliasSet(aliases, [
      "video",
      "videos",
      "movie",
      "movies",
      "clip",
      "clips",
      "vdo",
    ]);
  }

  if (mimeGroup === "audio") {
    addAliasSet(aliases, [
      "audio",
      "sound",
      "music",
      "song",
      "songs",
      "voice",
    ]);
  }

  if (mimeGroup === "text") {
    addAliasSet(aliases, [
      "text",
      "txt",
      "file",
      "files",
      "document",
      "documents",
    ]);
  }

  if (normalizedMimeType === "application/pdf") {
    addAliasSet(aliases, ["pdf", "document", "documents", "file", "files"]);
  }

  if (
    normalizedMimeType === "application/msword" ||
    normalizedMimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    addAliasSet(aliases, [
      "doc",
      "docx",
      "document",
      "documents",
      "word",
      "office",
      "file",
      "files",
    ]);
  }

  if (mimeGroup === "application") {
    addAliasSet(aliases, [
      "application",
      "app",
      "file",
      "files",
      "document",
      "documents",
      "data",
    ]);
  }

  return [
    item.fileName,
    item.description ?? "",
    item.uploaderName,
    item.uploaderUsername,
    item.category,
    ...aliases,
  ]
    .join(" ")
    .toLowerCase();
}

export function formatLatency(latencyMs: number | null) {
  if (latencyMs === null) return "--";
  return `${Math.max(Math.round(latencyMs), 0)} ms`;
}

export function formatSyncLabel(value: string | null) {
  if (!value) return "ยังไม่เคย sync";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function buildDashboardSummary(items: MediaItem[]): DashboardSummary {
  const totalBytes = items.reduce((sum, item) => sum + item.fileSize, 0);
  const categoryCounts = new Map<string, number>();
  const memberCounts = new Map<string, { name: string; uploads: number }>();

  for (const item of items) {
    categoryCounts.set(
      item.category,
      (categoryCounts.get(item.category) ?? 0) + 1,
    );
    memberCounts.set(item.uploaderUsername, {
      name: item.uploaderName,
      uploads: (memberCounts.get(item.uploaderUsername)?.uploads ?? 0) + 1,
    });
  }

  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topMembers = Array.from(memberCounts.entries())
    .map(([username, summary]) => ({
      username,
      name: summary.name,
      uploads: summary.uploads,
    }))
    .sort((a, b) => b.uploads - a.uploads)
    .slice(0, 4);

  return {
    totalBytes,
    totalItems: items.length,
    categories,
    topMembers,
    latestItem: items[0] ?? null,
  };
}
