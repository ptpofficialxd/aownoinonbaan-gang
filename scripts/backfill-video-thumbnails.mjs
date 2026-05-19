import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn, spawnSync } from "node:child_process";
import { loadEnv } from "./_load-env.mjs";

loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = Math.max(
  1,
  Math.min(Number(limitArg?.split("=")[1] || "50") || 50, 1000),
);

const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
if (ffmpegCheck.status !== 0) {
  console.error("ffmpeg is required to backfill video thumbnails.");
  process.exit(1);
}

const { deleteDriveFile, streamDriveFile, uploadFileToDrive } = await import(
  "../src/lib/drive.ts"
);
const { listVideoItemsMissingThumbnails, updateMediaThumbnail } = await import(
  "../src/lib/media.ts"
);

function sanitizeBaseName(fileName) {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "video";
  return baseName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 120);
}

async function downloadDriveFile(driveFileId, destinationPath) {
  const driveResponse = await streamDriveFile(driveFileId);
  if (!driveResponse.body) {
    throw new Error("Drive response body is empty.");
  }

  await pipeline(
    Readable.fromWeb(driveResponse.body),
    fs.createWriteStream(destinationPath),
  );
}

function generateThumbnail(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-y",
        "-ss",
        "0.2",
        "-i",
        inputPath,
        "-frames:v",
        "1",
        "-vf",
        "scale='min(1280,iw)':-2",
        "-q:v",
        "4",
        outputPath,
      ],
      {
        stdio: ["ignore", "ignore", "pipe"],
      },
    );

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `ffmpeg exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`,
        ),
      );
    });
  });
}

async function main() {
  const candidates = await listVideoItemsMissingThumbnails(limit);
  console.log(
    dryRun
      ? `[dry-run] Found ${candidates.length} video file(s) missing thumbnails.`
      : `Found ${candidates.length} video file(s) missing thumbnails.`,
  );

  if (!candidates.length) {
    return;
  }

  if (dryRun) {
    for (const item of candidates) {
      console.log(`- ${item.id} | ${item.category} | ${item.fileName}`);
    }
    return;
  }

  const tempDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "aownoinonbaan-thumbnail-backfill-"),
  );

  let succeeded = 0;
  let failed = 0;

  try {
    for (const [index, item] of candidates.entries()) {
      const baseName = sanitizeBaseName(item.fileName);
      const inputPath = path.join(tempDir, `${item.id}-${baseName}.video`);
      const outputPath = path.join(tempDir, `${item.id}-${baseName}.thumbnail.jpg`);

      console.log(
        `[${index + 1}/${candidates.length}] Processing ${item.fileName} (${item.id})`,
      );

      try {
        await downloadDriveFile(item.driveFileId, inputPath);
        await generateThumbnail(inputPath, outputPath);

        const thumbnailBytes = await fsp.readFile(outputPath);
        const thumbnailFile = new File(
          [thumbnailBytes],
          `${baseName}.thumbnail.jpg`,
          {
            type: "image/jpeg",
          },
        );

        const uploadedThumbnail = await uploadFileToDrive({
          fileName: thumbnailFile.name,
          mimeType: thumbnailFile.type,
          file: thumbnailFile,
          category: item.category,
          description: `Thumbnail for ${item.fileName}`,
          uploadKind: "thumbnail",
        });

        const updatedMediaId = await updateMediaThumbnail({
          mediaId: item.id,
          thumbnailDriveFileId: uploadedThumbnail.id,
          thumbnailMimeType: "image/jpeg",
        });

        if (!updatedMediaId) {
          await deleteDriveFile(uploadedThumbnail.id).catch(() => null);
          throw new Error("Database update returned no id.");
        }

        succeeded += 1;
        console.log(
          `  Saved thumbnail ${uploadedThumbnail.id} for ${item.fileName}`,
        );
      } catch (error) {
        failed += 1;
        console.error(
          `  Failed ${item.fileName}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      } finally {
        await Promise.allSettled([
          fsp.rm(inputPath, { force: true }),
          fsp.rm(outputPath, { force: true }),
        ]);
      }
    }
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }

  console.log(
    `Finished backfill. Success: ${succeeded}, Failed: ${failed}, Total: ${candidates.length}`,
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();
