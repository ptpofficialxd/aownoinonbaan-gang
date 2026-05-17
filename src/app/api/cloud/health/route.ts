import { NextResponse } from "next/server";
import { getGoogleDriveHealthInfo } from "@/lib/drive";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const health = await getGoogleDriveHealthInfo();
    return NextResponse.json(health, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cloud health check failed.";

    return NextResponse.json(
      {
        connected: false,
        latencyMs: null,
        checkedAt: new Date().toISOString(),
        error: message,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}
