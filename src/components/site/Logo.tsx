import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 text-zinc-100 transition-colors"
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_8px_30px_-12px_rgba(34,211,238,0.6)]">
        <span className="absolute inset-px rounded-[10px] bg-[#0b0d12]" />
        <span className="relative text-sm font-black text-cyan-300">A</span>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">
          เอาน้อยนอนบ้าน <span className="font-normal text-zinc-400">Gang</span>
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Private Cloud Space
        </span>
      </span>
    </Link>
  );
}
