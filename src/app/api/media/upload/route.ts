import { NextResponse } from "next/server";
import { uploadFileToDrive } from "@/lib/drive";
import { createMediaItem, normalizeCategory } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const category = normalizeCategory(
    String(formData.get("category") || "ELSE"),
  );
  const description = String(formData.get("description") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  let uploaded: Awaited<ReturnType<typeof uploadFileToDrive>>;
  try {
    uploaded = await uploadFileToDrive({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      file,
      category,
      description,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload to Google Drive failed.";
    const status = message.includes("not connected yet") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  const mediaId = await createMediaItem({
    driveFileId: uploaded.id,
    fileName: uploaded.name,
    mimeType: uploaded.mimeType || file.type || "application/octet-stream",
    fileSize: Number(uploaded.size || file.size || 0),
    category,
    description,
    driveViewLink: uploaded.webViewLink || uploaded.webContentLink || null,
    uploaderId: session.userId,
  });

  return NextResponse.json({
    ok: true,
    mediaId,
  });
}
