import { sql } from "./db";

export const CATEGORIES = [
  "CHIFA",
  "ELSE",
  "EMMA",
  "GINNA",
  "HONGYOK",
  "JINGJING",
  "KWAN",
  "LEWLEW",
  "LINGLING",
  "LOOKKED",
  "NAMPHET",
  "NANA",
  "NISHA",
  "PLOEN",
  "PRAE",
  "PRAIFA",
  "PUNPON",
  "SATANGPOUND",
  "SHENAE",
  "VALENTINES",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type MediaItem = {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description: string | null;
  driveViewLink: string | null;
  createdAt: string;
  uploaderName: string;
  uploaderEmail: string;
};

type MediaRow = {
  id: string;
  drive_file_id: string;
  file_name: string;
  mime_type: string;
  file_size: string | number;
  category: string;
  description: string | null;
  drive_view_link: string | null;
  created_at: string;
  uploader_name: string;
  uploader_email: string;
};

type MediaRecordRow = {
  id: string;
  drive_file_id: string;
  file_name: string;
  mime_type: string;
};

export function normalizeCategory(value: string) {
  const normalized = value.trim();
  if (!normalized) return "ELSE";

  const matched = CATEGORIES.find(
    (category) => category.toLowerCase() === normalized.toLowerCase(),
  );

  return matched ?? "ELSE";
}

function mapMediaRow(row: MediaRow): MediaItem {
  return {
    id: row.id,
    driveFileId: row.drive_file_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size ?? 0),
    category: row.category,
    description: row.description,
    driveViewLink: row.drive_view_link,
    createdAt: row.created_at,
    uploaderName: row.uploader_name,
    uploaderEmail: row.uploader_email,
  };
}

export async function listMediaItems() {
  const rows = (await sql()`
    SELECT
      media_items.id,
      media_items.drive_file_id,
      media_items.file_name,
      media_items.mime_type,
      media_items.file_size,
      media_items.category,
      media_items.description,
      media_items.drive_view_link,
      media_items.created_at,
      users.name AS uploader_name,
      users.email AS uploader_email
    FROM media_items
    INNER JOIN users ON users.id = media_items.uploader_id
    ORDER BY media_items.created_at DESC
  `) as MediaRow[];

  return rows.map(mapMediaRow);
}

export async function getMediaRecord(mediaId: string) {
  const rows = (await sql()`
    SELECT id, drive_file_id, file_name, mime_type
    FROM media_items
    WHERE id = ${mediaId}
    LIMIT 1
  `) as MediaRecordRow[];

  return rows[0] ?? null;
}

export async function deleteMediaItem(mediaId: string) {
  const rows = (await sql()`
    DELETE FROM media_items
    WHERE id = ${mediaId}
    RETURNING id
  `) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}

export async function createMediaItem(input: {
  driveFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description?: string | null;
  driveViewLink?: string | null;
  uploaderId: string;
}) {
  const rows = (await sql()`
    INSERT INTO media_items (
      drive_file_id,
      file_name,
      mime_type,
      file_size,
      category,
      description,
      drive_view_link,
      uploader_id
    )
    VALUES (
      ${input.driveFileId},
      ${input.fileName},
      ${input.mimeType},
      ${input.fileSize},
      ${input.category},
      ${input.description ?? null},
      ${input.driveViewLink ?? null},
      ${input.uploaderId}
    )
    RETURNING id
  `) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}

export async function getDashboardData() {
  const items = await listMediaItems();
  const totalBytes = items.reduce((sum, item) => sum + item.fileSize, 0);
  const categoryCounts = new Map<string, number>();
  const memberCounts = new Map<string, number>();

  for (const item of items) {
    categoryCounts.set(
      item.category,
      (categoryCounts.get(item.category) ?? 0) + 1,
    );
    memberCounts.set(
      item.uploaderName,
      (memberCounts.get(item.uploaderName) ?? 0) + 1,
    );
  }

  const topMembers = Array.from(memberCounts.entries())
    .map(([name, uploads]) => ({ name, uploads }))
    .sort((a, b) => b.uploads - a.uploads)
    .slice(0, 4);

  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    items,
    totalBytes,
    categories,
    topMembers,
    totalItems: items.length,
  };
}
