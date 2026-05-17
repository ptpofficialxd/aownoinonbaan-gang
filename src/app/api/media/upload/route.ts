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

  const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || "250");
  const formData = await request.formData();
  const file = formData.get("file");
  const category = normalizeCategory(
    String(formData.get("category") || "other"),
  );
  const description = String(formData.get("description") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (file.size > maxUploadSizeMb * 1024 * 1024) {
    return NextResponse.json(
      { error: `File exceeds ${maxUploadSizeMb} MB limit.` },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadFileToDrive({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    bytes,
    description,
  });

  const mediaId = await createMediaItem({
    driveFileId: uploaded.id,
    fileName: uploaded.name,
    mimeType: uploaded.mimeType || file.type || "application/octet-stream",
    fileSize: Number(uploaded.size || file.size || bytes.length),
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
