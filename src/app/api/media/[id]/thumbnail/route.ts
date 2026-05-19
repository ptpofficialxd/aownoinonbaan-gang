import { streamDriveFile, streamDriveThumbnail } from "@/lib/drive";
import { getMediaRecord } from "@/lib/media";
import { getServerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getMimeBadgeLabel(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return mimeType === "image/jpeg"
      ? "JPG"
      : (mimeType.split("/")[1]?.toUpperCase() ?? "IMG");
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

function getExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.at(-1)?.toUpperCase() ?? "") : "";
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
  const extension = getExtension(fileName);
  const title = fileName.length > 26 ? `${fileName.slice(0, 26)}...` : fileName;
  const isArchive = ["ZIP", "RAR", "7Z"].includes(extension);
  const variant =
    label === "PDF"
      ? {
          bg: "#f43f5e",
          soft: "#ffe4e6",
          page: "#fff7f7",
          line: "#fecdd3",
          header: "PAGE 1",
          body: `
            <rect x="308" y="342" width="560" height="18" rx="9" fill="#CBD5E1"/>
            <rect x="308" y="382" width="516" height="18" rx="9" fill="#CBD5E1"/>
            <rect x="308" y="422" width="470" height="18" rx="9" fill="#CBD5E1"/>
            <rect x="308" y="462" width="532" height="18" rx="9" fill="#E2E8F0"/>
            <rect x="308" y="532" width="584" height="132" rx="28" fill="#FFE4E6"/>
          `,
        }
      : label === "DOC"
        ? {
            bg: "#4f46e5",
            soft: "#e0e7ff",
            page: "#f8faff",
            line: "#c7d2fe",
            header: "DOCVIEW",
            body: `
              <rect x="308" y="342" width="560" height="18" rx="9" fill="#CBD5E1"/>
              <rect x="308" y="382" width="516" height="18" rx="9" fill="#CBD5E1"/>
              <rect x="308" y="422" width="470" height="18" rx="9" fill="#CBD5E1"/>
              <rect x="308" y="462" width="410" height="18" rx="9" fill="#E2E8F0"/>
              <rect x="308" y="532" width="320" height="18" rx="9" fill="#E2E8F0"/>
            `,
          }
        : label === "TXT"
          ? {
              bg: "#0ea5e9",
              soft: "#e0f2fe",
              page: "#f8fafc",
              line: "#bae6fd",
              title: "#0F172A",
              header: "PREVIEW",
              body: `
                <rect x="308" y="342" width="560" height="18" rx="9" fill="#CBD5E1"/>
                <rect x="308" y="382" width="516" height="18" rx="9" fill="#CBD5E1"/>
                <rect x="308" y="422" width="470" height="18" rx="9" fill="#CBD5E1"/>
                <rect x="308" y="462" width="532" height="18" rx="9" fill="#E2E8F0"/>
                <rect x="308" y="502" width="420" height="18" rx="9" fill="#E2E8F0"/>
              `,
            }
          : label === "AUD"
            ? {
                bg: "#14b8a6",
                soft: "#ccfbf1",
                page: "#08161b",
                line: "#2dd4bf",
                title: "#E6FFFB",
                header: "AUDIO",
                body: `
                  <rect x="308" y="340" width="560" height="220" rx="30" fill="#0F1F24"/>
                  <rect x="352" y="418" width="18" height="64" rx="9" fill="#2DD4BF"/>
                  <rect x="392" y="390" width="18" height="120" rx="9" fill="#5EEAD4"/>
                  <rect x="432" y="442" width="18" height="38" rx="9" fill="#99F6E4"/>
                  <rect x="472" y="372" width="18" height="154" rx="9" fill="#2DD4BF"/>
                  <rect x="512" y="404" width="18" height="92" rx="9" fill="#5EEAD4"/>
                  <rect x="552" y="352" width="18" height="178" rx="9" fill="#99F6E4"/>
                  <rect x="592" y="430" width="18" height="50" rx="9" fill="#2DD4BF"/>
                  <rect x="632" y="390" width="18" height="118" rx="9" fill="#5EEAD4"/>
                  <rect x="672" y="420" width="18" height="62" rx="9" fill="#99F6E4"/>
                  <rect x="712" y="378" width="18" height="142" rx="9" fill="#2DD4BF"/>
                  <rect x="752" y="408" width="18" height="88" rx="9" fill="#5EEAD4"/>
                  <rect x="792" y="438" width="18" height="44" rx="9" fill="#99F6E4"/>
                `,
              }
            : isArchive
              ? {
                  bg: "#f59e0b",
                  soft: "#fef3c7",
                  page: "#15110a",
                  line: "#fbbf24",
                  title: "#FFF7ED",
                  header: "ARCHIVE",
                  body: `
                    <rect x="308" y="340" width="560" height="250" rx="34" fill="#16120C"/>
                    <rect x="354" y="382" width="468" height="166" rx="28" fill="#2A1F0B"/>
                    <rect x="354" y="438" width="468" height="22" rx="11" fill="#F59E0B"/>
                    <rect x="560" y="382" width="56" height="166" fill="#FCD34D"/>
                    <rect x="542" y="416" width="92" height="18" rx="9" fill="#FDE68A"/>
                  `,
                }
              : {
                  bg: "#334155",
                  soft: "#e2e8f0",
                  page: "#0d141d",
                  line: "#94a3b8",
                  title: "#F8FAFC",
                  header: "FILE",
                  body: `
                    <rect x="336" y="338" width="470" height="276" rx="32" fill="#F8FAFC"/>
                    <rect x="336.5" y="338.5" width="469" height="275" rx="31.5" stroke="#CBD5E1"/>
                    <path d="M694 338h58l54 54v10h-78c-18 0-34-16-34-34v-30Z" fill="#E2E8F0"/>
                    <path d="M694 338h58l54 54" fill="none" stroke="#CBD5E1" stroke-width="8" stroke-linejoin="round"/>
                    <rect x="390" y="416" width="138" height="50" rx="25" fill="#334155"/>
                    <text x="459" y="448" text-anchor="middle" fill="#F8FAFC" font-size="24" font-family="Arial, sans-serif" font-weight="700" letter-spacing="3">FILE</text>
                    <rect x="390" y="500" width="360" height="16" rx="8" fill="#CBD5E1"/>
                    <rect x="390" y="536" width="326" height="16" rx="8" fill="#CBD5E1"/>
                    <rect x="390" y="572" width="268" height="16" rx="8" fill="#E2E8F0"/>
                  `,
                };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="900" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="900" rx="56" fill="#0f1720"/>
  <rect x="0" y="0" width="1200" height="900" rx="56" fill="url(#bg)"/>
  <rect x="248" y="110" width="704" height="680" rx="40" fill="${variant.page}"/>
  <rect x="248.5" y="110.5" width="703" height="679" rx="39.5" stroke="rgba(255,255,255,0.18)"/>
  <rect x="308" y="172" width="128" height="56" rx="28" fill="${variant.bg}"/>
  <text x="372" y="208" text-anchor="middle" fill="white" font-size="28" font-family="Arial, sans-serif" font-weight="700" letter-spacing="4">${escapeXml(label)}</text>
  <text x="848" y="206" text-anchor="end" fill="${variant.line}" font-size="20" font-family="Arial, sans-serif" font-weight="700" letter-spacing="3">${escapeXml(variant.header)}</text>
  <text x="308" y="292" fill="${variant.title ?? "#0F172A"}" font-size="46" font-family="Arial, sans-serif" font-weight="700">${escapeXml(title)}</text>
  ${variant.body}
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

  if (record.thumbnail_drive_file_id) {
    try {
      const storedThumbnailRes = await streamDriveFile(
        record.thumbnail_drive_file_id,
      );
      if (storedThumbnailRes?.body) {
        return new Response(storedThumbnailRes.body, {
          headers: {
            "Content-Type":
              storedThumbnailRes.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "private, no-store",
          },
        });
      }
    } catch {}
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
