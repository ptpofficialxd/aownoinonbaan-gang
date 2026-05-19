"use client";

import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/media";
import { getPreviewKind } from "./utils";

const previewTextCache = new Map<
  string,
  {
    text: string;
    truncated: boolean;
  }
>();

export function usePreviewText(previewItem: MediaItem | null) {
  const [previewText, setPreviewText] = useState("");
  const [previewTextLoading, setPreviewTextLoading] = useState(false);
  const [previewTextError, setPreviewTextError] = useState<string | null>(null);
  const [previewTextTruncated, setPreviewTextTruncated] = useState(false);

  useEffect(() => {
    if (!previewItem || getPreviewKind(previewItem.mimeType) !== "text") {
      setPreviewText("");
      setPreviewTextLoading(false);
      setPreviewTextError(null);
      setPreviewTextTruncated(false);
      return;
    }

    const controller = new AbortController();
    const cachedText = previewTextCache.get(previewItem.id);
    if (cachedText) {
      setPreviewText(cachedText.text);
      setPreviewTextLoading(false);
      setPreviewTextError(null);
      setPreviewTextTruncated(cachedText.truncated);
      return () => controller.abort();
    }

    setPreviewText("");
    setPreviewTextLoading(true);
    setPreviewTextError(null);
    setPreviewTextTruncated(false);

    fetch(`/api/media/${previewItem.id}/text-preview`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อความตัวอย่างได้");
        }
        const text = await response.text();
        const truncated =
          response.headers.get("x-text-preview-truncated") === "1";
        setPreviewTextTruncated(truncated);
        previewTextCache.set(previewItem.id, { text, truncated });
        return text;
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
    previewTextTruncated,
  };
}
