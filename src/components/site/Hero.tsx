import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function Hero({
  totalItems,
  totalMembers,
}: {
  totalItems: number;
  totalMembers: number;
}) {
  return (
    <section className="relative overflow-hidden pt-14 sm:pt-18">
      <div className="aurora absolute inset-0 -z-20 opacity-90" />
      <div className="grid-bg absolute inset-0 -z-10 opacity-35 [mask-image:radial-gradient(circle_at_top,black,transparent_72%)]" />
      <div className="mx-auto max-w-7xl px-6 pb-12">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] px-7 py-10 shadow-[0_45px_120px_-60px_rgba(34,211,238,0.6)] sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -left-10 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-400/12 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <Badge className="mb-5">gang-only cloud space</Badge>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                เอาน้อยนอนบ้าน
                <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  Shared media vault for the whole gang.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                อัปโหลดรูป วิดีโอ มีม เอกสาร และไฟล์ทุกอย่างไว้ในที่เดียว ดูได้ว่าใครอัปโหลดอะไร
                แยกตามหมวดหมู่ และใช้ Google Drive เป็น storage หลักแบบจุใจ
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#upload">
                  <Button>
                    Start Uploading
                    <Icon name="arrow-right" className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#library">
                  <Button variant="secondary">Browse Library</Button>
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Current library
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {totalItems}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  files already living in the vault
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Active members
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {totalMembers}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  private accounts backed by Neon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
