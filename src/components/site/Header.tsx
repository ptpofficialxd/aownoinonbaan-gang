import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getServerSession } from "@/lib/session";
import { Logo } from "./Logo";

export async function Header() {
  const session = await getServerSession();

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#050816]/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Logo />
          {session && (
            <nav className="hidden items-center gap-2 md:flex">
              <a
                href="#overview"
                className="rounded-full px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
              >
                Overview
              </a>
              <a
                href="#library"
                className="rounded-full px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
              >
                Library
              </a>
              <a
                href="#upload"
                className="rounded-full px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
              >
                Upload
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Badge>{session.role}</Badge>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-white">
                  {session.name}
                </div>
                <div className="text-xs text-zinc-500">{session.sub}</div>
              </div>
              <form action="/api/auth/logout" method="post">
                <Button variant="secondary" size="sm" type="submit">
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
