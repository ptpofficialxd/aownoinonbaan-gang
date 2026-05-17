import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex min-w-0 max-w-full items-center gap-2 text-zinc-100 transition-colors lg:gap-2.5"
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_8px_30px_-12px_rgba(34,211,238,0.6)]">
        <span className="absolute inset-px rounded-[10px] bg-[#0b0d12]" />
        <span className="relative text-sm font-black text-cyan-300">A</span>
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
