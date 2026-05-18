import type { MediaItem } from "@/lib/media";

export type MemberSummary = {
  username: string;
  name: string;
  uploads: number;
};

export type CloudHealthState = {
  checkedAt: string | null;
  error: string | null;
  isPaused: boolean;
  isPolling: boolean;
  latencyMs: number | null;
  online: boolean;
};

export type DashboardCategorySummary = {
  name: string;
  count: number;
};

export type DashboardSummary = {
  totalBytes: number;
  totalItems: number;
  categories: DashboardCategorySummary[];
  topMembers: MemberSummary[];
  latestItem: MediaItem | null;
};
