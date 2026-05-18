import { streamDriveThumbnail } from "@/lib/drive";
import { getMediaRecord } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getMimeBadgeLabel(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return mimeType === "image/jpeg"
      ? "JPG"
      : mimeType.split("/")[1]?.toUpperCase() ?? "IMG";
  }

  if (mimeType.startsWith("video/")) return "VDO";
  if (mimeType.startsWith("audio/")) return "AUD";
  if (mimeType.startsWith("text/")) return "TXT";
  if (mimeType === "application/pdf") return "PDF";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOC";
  }
  if (mimeType.startsWith("application/")) return "FILE";
  return mimeType.split("/")[0].toUpperCase();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildFallbackThumbnail(fileName: string, mimeType: string) {
  const label = getMimeBadgeLabel(mimeType);
  const title = fileName.length > 26 ? `${fileName.slice(0, 26)}...` : fileName;
  const accent =
    label === "PDF"
      ? { bg: "#f43f5e", soft: "#ffe4e6" }
      : label === "DOC"
        ? { bg: "#4f46e5", soft: "#e0e7ff" }
        : label === "TXT"
          ? { bg: "#0ea5e9", soft: "#e0f2fe" }
          : { bg: "#334155", soft: "#e2e8f0" };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="900" rx="56" fill="#0f1720"/>
  <rect x="0" y="0" width="1200" height="900" rx="56" fill="url(#bg)"/>
  <rect x="248" y="110" width="704" height="680" rx="40" fill="#F8FAFC"/>
  <rect x="248.5" y="110.5" width="703" height="679" rx="39.5" stroke="rgba(255,255,255,0.18)"/>
  <rect x="308" y="172" width="128" height="56" rx="28" fill="${accent.bg}"/>
  <text x="372" y="208" text-anchor="middle" fill="white" font-size="28" font-family="Arial, sans-serif" font-weight="700" letter-spacing="4">${escapeXml(label)}</text>
  <text x="308" y="292" fill="#0F172A" font-size="46" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title)}</text>
  <rect x="308" y="342" width="560" height="18" rx="9" fill="#CBD5E1"/>
  <rect x="308" y="382" width="516" height="18" rx="9" fill="#CBD5E1"/>
  <rect x="308" y="422" width="470" height="18" rx="9" fill="#CBD5E1"/>
  <rect x="308" y="462" width="532" height="18" rx="9" fill="#E2E8F0"/>
  <rect x="308" y="532" width="584" height="132" rx="28" fill="${accent.soft}"/>
  <defs>
    <linearGradient id="bg" x1="120" y1="44" x2="1138" y2="846" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10303B"/>
      <stop offset="1" stop-color="#101319"/>
    </linearGradient>
  </defs>
</svg>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = await context.params;
  const record = await getMediaRecord(params.id);
  if (!record) {
    return new Response("File not found", { status: 404 });
  }

  try {
    const thumbnailRes = await streamDriveThumbnail(record.drive_file_id);
    if (thumbnailRes?.body) {
      return new Response(thumbnailRes.body, {
        headers: {
          "Content-Type":
            thumbnailRes.headers.get("content-type") || "image/jpeg",
          "Cache-Control": "private, no-store",
        },
      });
    }
  } catch {}

  const svg = buildFallbackThumbnail(record.file_name, record.mime_type);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
