import { NextResponse } from "next/server";
import { deleteDriveFile } from "@/lib/drive";
import { deleteMediaItem, getMediaRecord } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
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

  await deleteDriveFile(record.drive_file_id).catch((error) => {
    throw error;
  });

  await deleteMediaItem(params.id);

  return NextResponse.json({ ok: true });
}
