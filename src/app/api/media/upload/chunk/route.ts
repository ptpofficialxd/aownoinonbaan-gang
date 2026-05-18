import { NextResponse } from "next/server";
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

  const sessionUrl = request.headers.get("x-upload-session-url")?.trim() || "";
  const start = Number(request.headers.get("x-upload-start"));
  const end = Number(request.headers.get("x-upload-end"));
  const total = Number(request.headers.get("x-upload-total"));
  const contentType =
    request.headers.get("content-type") || "application/octet-stream";
  const contentLength = request.headers.get("content-length");

  if (
    !sessionUrl ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(total)
  ) {
    return NextResponse.json(
      { error: "Chunk metadata is incomplete." },
      { status: 400 },
    );
  }

  const uploadRes = await fetch(sessionUrl, {
    method: "PUT",
    headers: {
      ...(contentLength ? { "Content-Length": contentLength } : {}),
      "Content-Type": contentType,
      "Content-Range": `bytes ${start}-${end}/${total}`,
    },
    body: request.body,
    duplex: "half",
    cache: "no-store",
  } as RequestInit & { duplex: "half" });

  if (uploadRes.status === 308) {
    return NextResponse.json({
      ok: true,
      done: false,
      range: uploadRes.headers.get("Range"),
    });
  }

  if (!uploadRes.ok) {
    const detail = await uploadRes.text();
    return NextResponse.json(
      {
        error: `Drive chunk upload failed: ${uploadRes.status} ${detail}`,
      },
      { status: 500 },
    );
  }

  const payload = (await uploadRes.json().catch(() => null)) as {
    id?: string;
    name?: string;
    mimeType?: string;
    size?: string;
    webViewLink?: string;
    webContentLink?: string;
  } | null;

  return NextResponse.json({
    ok: true,
    done: true,
    uploadResult: payload,
  });
}
