import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex min-w-0 max-w-full items-center gap-2 text-zinc-100 transition-colors lg:gap-2.5"
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/20 bg-white/[0.03] shadow-[0_8px_30px_-12px_rgba(34,211,238,0.45)]">
        <Image
          src="/เอาน้อยนอนบ้าน.png"
          alt="เอาน้อยนอนบ้าน"
          width={36}
          height={36}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-xs font-semibold tracking-tight md:text-sm">
          เอาน้อยนอนบ้าน <span className="font-normal text-zinc-400">Gang</span>
        </span>
        <span className="truncate text-[9px] uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px] sm:tracking-[0.18em]">
          Private Cloud Space
        </span>
      </span>
    </Link>
  );
}
