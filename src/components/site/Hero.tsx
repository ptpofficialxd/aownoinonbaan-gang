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
          <div className="pointer-events-none absolute -left-10 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-400/12 blur-3xl" />

          <div className="relative flex min-h-[18rem] items-center justify-center">
            <div className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  Google Drive Cloud Storage
                </Badge>
                <Badge className="border-white/10 bg-white/6 text-zinc-300">
                  Real-Time Callback
                </Badge>
              </div>

              <h1 className="mt-8 flex max-w-4xl flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                <span>เอาน้อยนอนบ้าน</span>
                <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  Cloud
                </span>
              </h1>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href="#upload">
                  <Button className="h-12 px-6">
                    Start Uploading
                    <Icon name="arrow-right" className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#library">
                  <Button variant="secondary" className="h-12 px-6">
                    Browse Library
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
