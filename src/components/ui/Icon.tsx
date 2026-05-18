import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconName =
  | "arrow-right"
  | "lock"
  | "mail"
  | "eye"
  | "eye-off"
  | "cloud"
  | "upload"
  | "video"
  | "image"
  | "folder"
  | "spark"
  | "logout"
  | "search"
  | "trash"
  | "check"
  | "x"
  | "bolt"
  | "user"
  | "heart"
  | "tag"
  | "hash"
  | "file"
  | "flame"
  | "chart-up"
  | "google-drive";

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
  mail: (
    <>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m4.5 7.5 7.5 6 7.5-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </>
  ),
  eye: (
    <>
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </>
  ),
  "eye-off": (
    <>
      <path
        d="M3 3l18 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M10.6 5.3A11 11 0 0 1 12 5.2c6 0 9.5 6 9.5 6a16.8 16.8 0 0 1-3 3.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M6.4 6.5A17.3 17.3 0 0 0 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M9.9 9.9A3 3 0 0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
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
  trash: (
    <>
      <path
        d="M4 7h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M10 11v5M14 11v5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  check: (
    <path
      d="m5 12.5 4.2 4.2L19 7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  x: (
    <>
      <path
        d="M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  bolt: (
    <path
      d="M13 2 6 13h4l-1 9 7-11h-4l1-9Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  user: (
    <>
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 19a7 7 0 0 1 14 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  heart: (
    <path
      d="M12 20.5 4.8 13.8a4.9 4.9 0 0 1 0-7 4.7 4.7 0 0 1 6.8 0L12 7.2l.4-.4a4.7 4.7 0 0 1 6.8 0 4.9 4.9 0 0 1 0 7Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  tag: (
    <path
      d="M20 10.5 11.5 19a2 2 0 0 1-2.8 0L4 14.3a2 2 0 0 1 0-2.8L12.5 3H20v7.5Z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  hash: (
    <>
      <path
        d="M9 3 7 21"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="m17 3-2 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M4 9h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M3 15h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  file: (
    <>
      <path
        d="M8 3h6l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M14 3v5h5"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </>
  ),
  flame: (
    <path
      d="M13.5 2.8c.7 2.7-.9 4.5-2.3 5.9-1.4 1.4-2.7 2.7-2.7 4.9 0 2.4 1.8 4.4 4.3 4.4 2.7 0 4.7-2.1 4.7-5 0-3.7-2.3-6.1-4-10.2Zm-2.6 9.9c1-1 2-2 2.2-3.8 1.4 1.9 2 3.1 2 4.7 0 1.7-1 2.9-2.4 2.9-1.3 0-2.2-1-2.2-2.3 0-.7.1-1 .4-1.5Z"
      fill="currentColor"
    />
  ),
  "chart-up": (
    <>
      <path
        d="M5 19V9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M12 19V5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M19 19v-8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="m4 10 5-4 4 2 7-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </>
  ),
  "google-drive": (
    <>
      <path d="M9.8 3.4h4.3l5.7 9.9h-4.2Z" fill="#F4C542" />
      <path d="M9.8 3.4 2.8 15.4l2.1 3.7 7.1-12.1Z" fill="#17A05D" />
      <path d="M4.9 19.1h13.8l2.3-3.9H7.1Z" fill="#4285F4" />
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
