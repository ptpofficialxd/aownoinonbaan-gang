import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconName =
  | "arrow-right"
  | "lock"
  | "cloud"
  | "upload"
  | "video"
  | "image"
  | "folder"
  | "spark"
  | "logout"
  | "search";

const iconMap: Record<IconName, ReactNode> = {
  "arrow-right": (
    <path
      d="M5 12h14m-5-5 5 5-5 5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  lock: (
    <>
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </>
  ),
  cloud: (
    <path
      d="M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.2 8.6 4.5 4.5 0 0 0 7 18Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  ),
  upload: (
    <>
      <path
        d="M12 16V6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="m8 10 4-4 4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  video: (
    <>
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="m16 10 5-3v10l-5-3Z" fill="currentColor" />
    </>
  ),
  image: (
    <>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path
        d="m21 16-4.5-4.5L8 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </>
  ),
  folder: (
    <path
      d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  ),
  spark: (
    <path
      d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z"
      fill="currentColor"
    />
  ),
  logout: (
    <>
      <path
        d="M10 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 12H9m7-4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </>
  ),
  search: (
    <>
      <circle
        cx="11"
        cy="11"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m20 20-4-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      {iconMap[name]}
    </svg>
  );
}
