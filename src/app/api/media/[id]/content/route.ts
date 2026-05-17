import { NextResponse } from "next/server";
import { streamDriveFile } from "@/lib/drive";
import { getMediaRecord } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const driveResponse = await streamDriveFile(record.drive_file_id).catch(
    () => null,
  );
  if (!driveResponse?.body) {
    return NextResponse.json({ error: "Unable to read file" }, { status: 502 });
  }

  return new Response(driveResponse.body, {
    headers: {
      "Content-Type":
        driveResponse.headers.get("content-type") || record.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(record.file_name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
