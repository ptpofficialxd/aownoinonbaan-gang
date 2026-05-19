import { NextResponse } from "next/server";
import { createDriveUploadSession } from "@/lib/drive";
import { normalizeCategory } from "@/lib/media";
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
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    category?: string;
    description?: string;
    uploadKind?: "media" | "thumbnail";
  } | null;

  if (!body?.fileName || !body.fileSize) {
    return NextResponse.json(
      { error: "File metadata is required." },
      { status: 400 },
    );
  }

  try {
    const upload = await createDriveUploadSession({
      fileName: body.fileName,
      mimeType: body.mimeType || "application/octet-stream",
      fileSize: body.fileSize,
      category: normalizeCategory(body.category || "ELSE"),
      description: body.description?.trim() || null,
      uploadKind: body.uploadKind === "thumbnail" ? "thumbnail" : "media",
    });

    return NextResponse.json(upload);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not start Google Drive upload session.";
    const status = message.includes("not connected yet") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
