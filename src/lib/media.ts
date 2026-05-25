import { sql } from "./db";

const BASE_CATEGORY_SECTIONS = {
  CGM48: [
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
  ],
  BNK48: [
    "ARLEE",
    "BERRY",
    "BLYTHE",
    "CARTOON",
    "EMMY",
    "FAME",
    "GALEYA",
    "GRAPE",
    "HOOP",
    "INKCHA",
    "JANRY",
    "JEW",
    "KHAIMOOK",
    "KHOWJOW",
    "L",
    "LUKSORN",
    "MAIL",
    "MARINE",
    "MAYJI",
    "MICHA",
    "MINT",
    "MIRIN",
    "MONET",
    "NALL",
    "NAMMONN",
    "NEEN",
    "NIYA",
    "PALMMY",
    "PANCAKE",
    "PATT",
    "PRAEW",
    "PROUD",
    "ROSE",
    "SAONOI",
    "SINDY",
    "WAWA",
    "YOGHURT",
  ],
  OTHER: ["อื่นๆ", "เสว"],
} as const;

export type BaseCategorySection = keyof typeof BASE_CATEGORY_SECTIONS;
export type CategorySection = "ALL" | BaseCategorySection;
export const SECTION_FILTER_PREFIX = "__section__:";

export const CATEGORY_SECTIONS = {
  ALL: Object.values(BASE_CATEGORY_SECTIONS).flat(),
  ...BASE_CATEGORY_SECTIONS,
} as const satisfies Record<CategorySection, readonly string[]>;

export const CATEGORY_SECTION_NAMES = [
  "ALL",
  ...(Object.keys(BASE_CATEGORY_SECTIONS) as BaseCategorySection[]),
] as const satisfies readonly CategorySection[];
export const BASE_CATEGORY_SECTION_NAMES = Object.keys(
  BASE_CATEGORY_SECTIONS,
) as BaseCategorySection[];

export const CATEGORIES = Object.values(BASE_CATEGORY_SECTIONS).flat() as Array<
  (typeof BASE_CATEGORY_SECTIONS)[BaseCategorySection][number]
>;

export type Category = (typeof CATEGORIES)[number];

export type MediaItem = {
  id: string;
  driveFileId: string;
  thumbnailDriveFileId: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  description: string | null;
  driveViewLink: string | null;
  createdAt: string;
  uploaderName: string;
  uploaderUsername: string;
};

export type MediaThumbnailBackfillItem = {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  category: string;
};

type MediaRow = {
  id: string;
  drive_file_id: string;
  thumbnail_drive_file_id: string | null;
  file_name: string;
  mime_type: string;
  file_size: string | number;
  category: string;
  description: string | null;
  drive_view_link: string | null;
  created_at: string;
  uploader_name: string;
  uploader_username: string;
};

type MediaRecordRow = {
  id: string;
  drive_file_id: string;
  thumbnail_drive_file_id: string | null;
  file_name: string;
  mime_type: string;
  category: string;
};

type MediaThumbnailBackfillRow = {
  id: string;
  drive_file_id: string;
  file_name: string;
  mime_type: string;
  category: string;
};

export function normalizeCategory(value: string) {
  const normalized = value.trim();
  if (!normalized) return "ELSE";

  const matched = CATEGORIES.find(
    (category) => category.toLowerCase() === normalized.toLowerCase(),
  );

  return matched ?? "ELSE";
}

export function getCategorySection(category: string): CategorySection | null {
  const normalized = category.trim().toLowerCase();

  for (const section of Object.keys(BASE_CATEGORY_SECTIONS) as BaseCategorySection[]) {
    if (
      BASE_CATEGORY_SECTIONS[section].some(
        (entry) => entry.toLowerCase() === normalized,
      )
    ) {
      return section;
    }
  }

  return null;
}

export function getCategoriesForSection(section: CategorySection) {
  return CATEGORY_SECTIONS[section];
}

export function createSectionFilterValue(section: CategorySection) {
  return section === "ALL" ? "all" : `${SECTION_FILTER_PREFIX}${section}`;
}

export function parseSectionFilterValue(value: string): CategorySection | null {
  if (value === "all") return "ALL";
  if (!value.startsWith(SECTION_FILTER_PREFIX)) return null;

  const section = value.slice(SECTION_FILTER_PREFIX.length) as CategorySection;
  return CATEGORY_SECTION_NAMES.includes(section) ? section : null;
}

function mapMediaRow(row: MediaRow): MediaItem {
  return {
    id: row.id,
    driveFileId: row.drive_file_id,
    thumbnailDriveFileId: row.thumbnail_drive_file_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size ?? 0),
    category: row.category,
    description: row.description,
    driveViewLink: row.drive_view_link,
    createdAt: row.created_at,
    uploaderName: row.uploader_name,
    uploaderUsername: row.uploader_username,
  };
}

export async function listMediaItems() {
  const rows = (await sql()`
    SELECT
      media_items.id,
      media_items.drive_file_id,
      media_items.thumbnail_drive_file_id,
      media_items.file_name,
      media_items.mime_type,
      media_items.file_size,
      media_items.category,
      media_items.description,
      media_items.drive_view_link,
      media_items.created_at,
      users.name AS uploader_name,
      users.username AS uploader_username
    FROM media_items
    INNER JOIN users ON users.id = media_items.uploader_id
    ORDER BY media_items.created_at DESC
  `) as MediaRow[];

  return rows.map(mapMediaRow);
}

export async function getMediaRecord(mediaId: string) {
  const rows = (await sql()`
    SELECT
      id,
      drive_file_id,
      thumbnail_drive_file_id,
      file_name,
      mime_type,
      category
    FROM media_items
    WHERE id = ${mediaId}
    LIMIT 1
  `) as MediaRecordRow[];

  return rows[0] ?? null;
}

export async function getMediaRecords(mediaIds: string[]) {
  if (!mediaIds.length) return [];

  const rows = (await sql()`
    SELECT id, drive_file_id, thumbnail_drive_file_id, file_name, mime_type
    FROM media_items
    WHERE id = ANY(${mediaIds}::uuid[])
  `) as MediaRecordRow[];

  return rows;
}

export async function listVideoItemsMissingThumbnails(limit = 100) {
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit) || 100, 1000));
  const rows = (await sql()`
    SELECT
      id,
      drive_file_id,
      file_name,
      mime_type,
      category
    FROM media_items
    WHERE mime_type LIKE 'video/%'
      AND thumbnail_drive_file_id IS NULL
    ORDER BY created_at ASC
    LIMIT ${safeLimit}
  `) as MediaThumbnailBackfillRow[];

  return rows.map((row) => ({
    id: row.id,
    driveFileId: row.drive_file_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    category: row.category,
  })) satisfies MediaThumbnailBackfillItem[];
}

export async function updateMediaThumbnail(input: {
  mediaId: string;
  thumbnailDriveFileId: string;
  thumbnailMimeType?: string | null;
}) {
  const rows = (await sql()`
    UPDATE media_items
    SET
      thumbnail_drive_file_id = ${input.thumbnailDriveFileId},
      thumbnail_mime_type = ${input.thumbnailMimeType ?? "image/jpeg"}
    WHERE id = ${input.mediaId}
    RETURNING id
  `) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}

export async function deleteMediaItem(mediaId: string) {
  const rows = (await sql()`
    DELETE FROM media_items
    WHERE id = ${mediaId}
    RETURNING id
  `) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}

export async function deleteMediaItems(mediaIds: string[]) {
  if (!mediaIds.length) return [];

  const rows = (await sql()`
    DELETE FROM media_items
    WHERE id = ANY(${mediaIds}::uuid[])
    RETURNING id
  `) as Array<{ id: string }>;

  return rows.map((row) => row.id);
}

export async function createMediaItem(input: {
  driveFileId: string;
  thumbnailDriveFileId?: string | null;
  thumbnailMimeType?: string | null;
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
      thumbnail_drive_file_id,
      thumbnail_mime_type,
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
      ${input.thumbnailDriveFileId ?? null},
      ${input.thumbnailMimeType ?? null},
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
  const memberCounts = new Map<string, { name: string; uploads: number }>();

  for (const item of items) {
    categoryCounts.set(
      item.category,
      (categoryCounts.get(item.category) ?? 0) + 1,
    );
    const current = memberCounts.get(item.uploaderUsername);
    memberCounts.set(item.uploaderUsername, {
      name: item.uploaderName,
      uploads: (current?.uploads ?? 0) + 1,
    });
  }

  const topMembers = Array.from(memberCounts.entries())
    .map(([username, summary]) => ({
      username,
      name: summary.name,
      uploads: summary.uploads,
    }))
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
