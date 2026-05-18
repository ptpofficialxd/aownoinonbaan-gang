import { NextResponse } from "next/server";
import { deleteManagedMediaBatch } from "@/lib/media-management";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    ids?: unknown;
  } | null;

  if (!body || !Array.isArray(body.ids)) {
    return NextResponse.json(
      { error: "A list of file ids is required." },
      { status: 400 },
    );
  }

  const ids = body.ids.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  if (!ids.length) {
    return NextResponse.json(
      { error: "At least one file id is required." },
      { status: 400 },
    );
  }

  const result = await deleteManagedMediaBatch(ids);
  if (!result.found) {
    return NextResponse.json({ error: "Files not found." }, { status: 404 });
  }

  if (!result.deletedIds.length) {
    return NextResponse.json(
      {
        error: "Could not delete the selected files.",
        failedIds: result.failedIds,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: result.failedIds.length === 0,
    deletedIds: result.deletedIds,
    failedIds: result.failedIds,
  });
}
