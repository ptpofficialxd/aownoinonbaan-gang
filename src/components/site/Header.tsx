import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getServerSession } from "@/lib/session";
import { Logo } from "./Logo";

function getRoleBadgeClass(role: "admin" | "member") {
  if (role === "admin") {
    return "border-fuchsia-300/25 bg-[linear-gradient(135deg,rgba(244,114,182,0.22),rgba(192,38,211,0.18))] text-pink-50 shadow-[0_0_0_1px_rgba(244,114,182,0.1),0_0_24px_rgba(236,72,153,0.22),inset_0_1px_0_rgba(255,255,255,0.16)]";
  }

  return "border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.2),rgba(59,130,246,0.18))] text-cyan-50 shadow-[0_0_0_1px_rgba(56,189,248,0.08),0_0_24px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.14)]";
}

export async function Header() {
  const session = await getServerSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080b]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center justify-between gap-3 overflow-x-clip px-4 md:px-5 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3 lg:gap-8">
          <Logo />
          {session && (
            <nav className="hidden shrink-0 items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1 md:flex">
              <a
                href="#home"
                className="rounded-full px-2 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/7 hover:text-zinc-100 lg:px-3 lg:text-sm"
              >
                หน้าหลัก
              </a>
              <a
                href="#library"
                className="rounded-full px-2 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/7 hover:text-zinc-100 lg:px-3 lg:text-sm"
              >
                คลัง
              </a>
              <a
                href="#upload"
                className="rounded-full px-2 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-white/7 hover:text-zinc-100 lg:px-3 lg:text-sm"
              >
                อัปโหลด
              </a>
            </nav>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-2 lg:gap-3">
          {session ? (
            <>
              <div className="hidden min-w-0 items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-2 py-1.5 sm:flex lg:gap-3 lg:px-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-[11px] font-semibold text-slate-950">
                  {session.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 text-[11px] font-medium text-white lg:text-sm">
                  <div className="truncate">{session.name}</div>
                  <div className="hidden text-xs font-normal text-zinc-500 xl:block">
                    @{session.sub}
                  </div>
                </div>
                <Badge
                  className={`relative overflow-hidden px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.28em] ${getRoleBadgeClass(session.role)}`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-12 rounded-full blur-xl ${
                      session.role === "admin"
                        ? "bg-pink-300/18"
                        : "bg-cyan-200/18"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`relative mr-2 inline-block h-1.5 w-1.5 rounded-full ${
                      session.role === "admin"
                        ? "bg-pink-100 shadow-[0_0_12px_rgba(251,207,232,0.9)]"
                        : "bg-cyan-100 shadow-[0_0_12px_rgba(207,250,254,0.85)]"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative">
                    {session.role === "admin" ? "ADMIN" : "MEMBER"}
                  </span>
                </Badge>
              </div>
              <form action="/api/auth/logout" method="post">
                <Button
                  variant="secondary"
                  size="sm"
                  type="submit"
                  className="h-9 border border-white/10 bg-white/[0.04] px-2.5 text-[11px] hover:bg-white/[0.08] lg:px-4 lg:text-sm"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 ring-1 ring-inset ring-white/8">
                    <Icon name="logout" className="h-3.5 w-3.5" />
                  </span>
                  ออกจากระบบ
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
