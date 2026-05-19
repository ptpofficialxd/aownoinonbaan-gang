import { NextResponse } from "next/server";
import type { MediaItem } from "@/lib/media";
import { createMediaItem, normalizeCategory } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";
export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    driveFileId?: string;
    thumbnailDriveFileId?: string | null;
    thumbnailMimeType?: string | null;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    category?: string;
    description?: string | null;
    driveViewLink?: string | null;
    driveContentLink?: string | null;
  } | null;

  if (!body?.driveFileId || !body.fileName || !body.mimeType) {
    return NextResponse.json(
      { error: "Uploaded file metadata is required." },
      { status: 400 },
    );
  }

  const mediaId = await createMediaItem({
    driveFileId: body.driveFileId,
    thumbnailDriveFileId: body.thumbnailDriveFileId || null,
    thumbnailMimeType: body.thumbnailMimeType || null,
    fileName: body.fileName,
    mimeType: body.mimeType,
    fileSize: Number(body.fileSize || 0),
    category: normalizeCategory(body.category || "ELSE"),
    description: body.description?.trim() || null,
    driveViewLink: body.driveViewLink || body.driveContentLink || null,
    uploaderId: session.userId,
  });

  const mediaItem: MediaItem | null = mediaId
    ? {
        id: mediaId,
        driveFileId: body.driveFileId,
        thumbnailDriveFileId: body.thumbnailDriveFileId || null,
        fileName: body.fileName,
        mimeType: body.mimeType,
        fileSize: Number(body.fileSize || 0),
        category: normalizeCategory(body.category || "ELSE"),
        description: body.description?.trim() || null,
        driveViewLink: body.driveViewLink || body.driveContentLink || null,
        createdAt: new Date().toISOString(),
        uploaderName: session.name,
        uploaderUsername: session.sub,
      }
    : null;

  return NextResponse.json({
    ok: true,
    mediaId,
    mediaItem,
  });
}
