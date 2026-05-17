export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-zinc-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          <span>เอาน้อยนอนบ้าน gang · Private Cloud Storage</span>
        </div>
        <div className="flex items-center gap-4">
          <span>v1.0.0</span>
          <span className="text-zinc-700">·</span>
          <span>© {year} ptpofficialxd. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
