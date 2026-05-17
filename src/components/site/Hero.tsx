import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 sm:pt-18">
      <div className="aurora absolute inset-0 -z-20 opacity-90" />
      <div className="grid-bg absolute inset-0 -z-10 opacity-35 [mask-image:radial-gradient(circle_at_top,black,transparent_72%)]" />
      <div className="mx-auto max-w-7xl px-6 pb-10">
        <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.045] px-7 py-10 shadow-[0_45px_120px_-60px_rgba(34,211,238,0.6)] sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_52%),linear-gradient(180deg,rgba(7,10,16,0.3),rgba(7,10,16,0.08))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,19,0.72)_0%,rgba(8,12,19,0.38)_42%,rgba(8,12,19,0.72)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,19,0.62)_0%,rgba(8,12,19,0.18)_38%,rgba(8,12,19,0.72)_100%)]" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <img
              src="/เอาน้อยนอนบ้าน.png"
              alt=""
              aria-hidden="true"
              className="w-[78%] max-w-[740px] -translate-y-2 object-contain opacity-16 blur-[0.8px] saturate-125 sm:w-[82%] sm:max-w-[860px] sm:translate-y-2 lg:w-[72%] lg:max-w-[980px] lg:translate-y-4 xl:w-[64%] xl:max-w-[920px] xl:translate-y-1 2xl:w-[60%] 2xl:max-w-[900px] 2xl:-translate-y-1"
            />
          </div>
          <div className="pointer-events-none absolute -left-10 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-400/12 blur-3xl" />

          <div className="relative flex min-h-[18rem] items-center justify-center xl:min-h-[21rem]">
            <div className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  Private Cloud Space
                </Badge>
                <Badge className="border-white/10 bg-white/6 text-zinc-300">
                  Real-Time Sync
                </Badge>
              </div>

              <h1 className="mt-8 flex max-w-4xl flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[4.25rem] xl:text-[4.7rem]">
                <span>เอาน้อยนอนบ้าน</span>
                <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  Space
                </span>
              </h1>

              <div className="mt-8 flex flex-wrap items-center justify-center">
                <a href="#library">
                  <Button className="group relative h-14 gap-3 overflow-hidden rounded-full border border-cyan-200/24 bg-[linear-gradient(135deg,rgba(11,20,34,0.82),rgba(36,77,107,0.74))] px-5 text-[0.98rem] font-semibold text-white shadow-[0_24px_60px_-24px_rgba(34,211,238,0.55)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-200/40 hover:bg-[linear-gradient(135deg,rgba(17,30,49,0.9),rgba(44,97,138,0.82))] hover:shadow-[0_26px_70px_-22px_rgba(56,189,248,0.78)]">
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.02))] opacity-90" />
                    <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/75 to-transparent" />
                    <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/18 bg-white/10 text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                      <Icon name="folder" className="h-4 w-4" />
                    </span>
                    <span className="relative text-white [text-shadow:0_1px_10px_rgba(8,12,19,0.45)]">
                      งื้อออออ
                    </span>
                    <Icon
                      name="arrow-right"
                      className="relative h-4 w-4 text-cyan-100 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
