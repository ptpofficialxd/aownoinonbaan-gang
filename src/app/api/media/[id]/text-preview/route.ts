import { NextResponse } from "next/server";
import { streamDriveFile } from "@/lib/drive";
import { getMediaRecord } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEXT_PREVIEW_BYTE_LIMIT = 64 * 1024;
const TEXT_PREVIEW_CACHE_CONTROL =
  "private, max-age=3600, stale-while-revalidate=86400";

function isTextPreviewMimeType(mimeType: string) {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript"
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const record = await getMediaRecord(params.id);
  if (!record) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!isTextPreviewMimeType(record.mime_type)) {
    return NextResponse.json(
      { error: "This file type does not support text preview." },
      { status: 415 },
    );
  }

  const driveResponse = await streamDriveFile(record.drive_file_id, {
    range: `bytes=0-${TEXT_PREVIEW_BYTE_LIMIT - 1}`,
  }).catch(() => null);

  if (!driveResponse?.body) {
    return NextResponse.json(
      { error: "Unable to load text preview." },
      { status: 502 },
    );
  }

  const contentRange = driveResponse.headers.get("content-range");
  const buffer = await driveResponse.arrayBuffer();
  const text = new TextDecoder("utf-8").decode(buffer);
  const isTruncated = Boolean(contentRange) || buffer.byteLength >= TEXT_PREVIEW_BYTE_LIMIT;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": TEXT_PREVIEW_CACHE_CONTROL,
      "X-Text-Preview-Truncated": isTruncated ? "1" : "0",
    },
    status: 200,
  });
}
