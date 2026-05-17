import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getServerSession } from "@/lib/session";
import { Logo } from "./Logo";

export async function Header() {
  const session = await getServerSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080b]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Logo />
          {session && (
            <nav className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1 md:flex">
              <a
                href="#overview"
                className="rounded-full px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/7 hover:text-zinc-100"
              >
                Overview
              </a>
              <a
                href="#library"
                className="rounded-full px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/7 hover:text-zinc-100"
              >
                Library
              </a>
              <a
                href="#upload"
                className="rounded-full px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/7 hover:text-zinc-100"
              >
                Upload
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 sm:flex">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-semibold text-slate-950">
                  {session.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-sm font-medium text-white">
                  {session.name}
                  <div className="text-xs font-normal text-zinc-500">
                    {session.sub}
                  </div>
                </div>
                <Badge>{session.role}</Badge>
              </div>
              <form action="/api/auth/logout" method="post">
                <Button
                  variant="secondary"
                  size="sm"
                  type="submit"
                  className="h-9 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                >
                  Logout
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
