import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 text-sm font-black text-slate-950 shadow-[0_18px_40px_-18px_rgba(56,189,248,0.95)]">
        A
      </span>
      <div>
        <div className="text-sm font-semibold tracking-tight text-white">
          aownoinonbaan
        </div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          private gang cloud
        </div>
      </div>
    </Link>
  );
}
