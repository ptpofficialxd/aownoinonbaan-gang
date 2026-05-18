import { NextResponse } from "next/server";
import { streamDriveFile } from "@/lib/drive";
import { getMediaRecord } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
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

  const range = request.headers.get("range");
  const driveResponse = await streamDriveFile(record.drive_file_id, {
    range,
  }).catch(() => null);
  if (!driveResponse?.body) {
    return NextResponse.json({ error: "Unable to read file" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  responseHeaders.set(
    "Content-Type",
    driveResponse.headers.get("content-type") || record.mime_type,
  );
  responseHeaders.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(record.file_name)}"`,
  );
  responseHeaders.set("Cache-Control", "private, no-store");

  const contentLength = driveResponse.headers.get("content-length");
  const contentRange = driveResponse.headers.get("content-range");
  const acceptRanges = driveResponse.headers.get("accept-ranges");

  if (contentLength) {
    responseHeaders.set("Content-Length", contentLength);
  }
  if (contentRange) {
    responseHeaders.set("Content-Range", contentRange);
  }
  if (acceptRanges) {
    responseHeaders.set("Accept-Ranges", acceptRanges);
  } else {
    responseHeaders.set("Accept-Ranges", "bytes");
  }

  return new Response(driveResponse.body, {
    headers: responseHeaders,
    status: driveResponse.status,
    statusText: driveResponse.statusText,
  });
}
