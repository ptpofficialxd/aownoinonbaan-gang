"use client";

import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/media";
import { getPreviewKind } from "./utils";

export function usePreviewText(previewItem: MediaItem | null) {
  const [previewText, setPreviewText] = useState("");
  const [previewTextLoading, setPreviewTextLoading] = useState(false);
  const [previewTextError, setPreviewTextError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewItem || getPreviewKind(previewItem.mimeType) !== "text") {
      setPreviewText("");
      setPreviewTextLoading(false);
      setPreviewTextError(null);
      return;
    }

    const controller = new AbortController();
    setPreviewText("");
    setPreviewTextLoading(true);
    setPreviewTextError(null);

    fetch(`/api/media/${previewItem.id}/content`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อความตัวอย่างได้");
        }
        return response.text();
      })
      .then((text) => {
        setPreviewText(text);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setPreviewTextError(
          error instanceof Error ? error.message : "โหลดข้อความไม่สำเร็จ",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPreviewTextLoading(false);
        }
      });

    return () => controller.abort();
  }, [previewItem]);

  return {
    previewText,
    previewTextError,
    previewTextLoading,
  };
}
