import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 sm:pt-12 md:pt-9 xl:pt-8">
      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 md:pb-5 xl:pb-4">
        <div className="relative flex min-h-[16rem] min-w-0 items-center justify-center md:min-h-[14.75rem] lg:min-h-[17rem] xl:min-h-[18rem]">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* biome-ignore lint/performance/noImgElement: decorative hero watermark */}
            <img
              src="/เอาน้อยนอนบ้าน.png"
              alt=""
              aria-hidden="true"
              className="w-[82%] max-w-[640px] -translate-y-1 object-contain opacity-14 blur-[0.8px] saturate-125 sm:w-[76%] sm:max-w-[760px] md:max-w-[720px] lg:w-[70%] lg:max-w-[900px] lg:translate-y-3 xl:w-[62%] xl:max-w-[920px] xl:translate-y-1 2xl:w-[58%] 2xl:max-w-[900px]"
            />
          </div>
          <div className="pointer-events-none absolute left-0 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-cyan-400/18 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-400/12 blur-3xl" />

          <div className="relative flex w-full min-w-0 max-w-5xl flex-col items-center justify-center overflow-hidden text-center">
            <div className="flex max-w-full flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                Private Cloud Space
              </Badge>
              <Badge className="border-white/10 bg-white/6 text-zinc-300">
                Real-Time Sync
              </Badge>
            </div>

            <h1 className="mt-6 flex max-w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-1 px-2 text-[2rem] leading-none font-semibold tracking-tight text-white sm:max-w-4xl sm:gap-x-3 sm:text-5xl md:mt-5 md:text-[3.45rem] lg:mt-7 lg:text-[3.9rem] xl:text-[4.25rem]">
              <span className="min-w-0 break-words">เอาน้อยนอนบ้าน</span>
              <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                Space
              </span>
            </h1>

            <div className="mt-6 flex max-w-full flex-wrap items-center justify-center px-2 md:mt-5 lg:mt-7">
              <a href="#library">
                <Button className="group relative h-12 max-w-full gap-2.5 overflow-hidden rounded-full border border-cyan-200/24 bg-[linear-gradient(135deg,rgba(11,20,34,0.82),rgba(36,77,107,0.74))] px-3.5 text-[0.9rem] font-semibold text-white shadow-[0_24px_60px_-24px_rgba(34,211,238,0.55)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-200/40 hover:bg-[linear-gradient(135deg,rgba(17,30,49,0.9),rgba(44,97,138,0.82))] hover:shadow-[0_26px_70px_-22px_rgba(56,189,248,0.78)] sm:h-14 sm:gap-3 sm:px-5 sm:text-[0.98rem]">
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
    </section>
  );
}
