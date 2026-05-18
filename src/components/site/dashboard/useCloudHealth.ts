"use client";

import { useEffect, useRef, useState } from "react";
import type { CloudHealthState } from "./types";

export function useCloudHealth(driveConnected: boolean) {
  const [cloudHealth, setCloudHealth] = useState<CloudHealthState>({
    checkedAt: null,
    error: null,
    isPaused: false,
    isPolling: false,
    latencyMs: null,
    online: driveConnected,
  });
  const pollingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function clearCloudHealthTimer() {
      if (pollingTimeoutRef.current !== null) {
        window.clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    }

    if (!driveConnected) {
      setCloudHealth({
        checkedAt: null,
        error: null,
        isPaused: false,
        isPolling: false,
        latencyMs: null,
        online: false,
      });
      return;
    }

    async function pollCloudHealth() {
      if (document.hidden) {
        return;
      }

      setCloudHealth((current) => ({
        ...current,
        error: null,
        isPaused: false,
        isPolling: true,
      }));

      try {
        const res = await fetch("/api/cloud/health", {
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({}))) as {
          checkedAt?: string;
          connected?: boolean;
          error?: string;
          latencyMs?: number | null;
        };

        setCloudHealth({
          checkedAt: data.checkedAt ?? new Date().toISOString(),
          error: res.ok ? null : (data.error ?? "Cloud health check failed."),
          isPaused: false,
          isPolling: false,
          latencyMs: typeof data.latencyMs === "number" ? data.latencyMs : null,
          online: Boolean(data.connected && res.ok),
        });
      } catch (error) {
        setCloudHealth((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : "Cloud health check failed.",
          isPaused: false,
          isPolling: false,
          online: false,
        }));
      } finally {
        clearCloudHealthTimer();

        if (!document.hidden) {
          pollingTimeoutRef.current = window.setTimeout(() => {
            void pollCloudHealth();
          }, 10_000);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearCloudHealthTimer();
        setCloudHealth((current) => ({
          ...current,
          isPaused: true,
          isPolling: false,
        }));
        return;
      }

      setCloudHealth((current) => ({
        ...current,
        isPaused: false,
      }));
      void pollCloudHealth();
    }

    void pollCloudHealth();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearCloudHealthTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [driveConnected]);

  return cloudHealth;
}
