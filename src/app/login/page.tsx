"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const contact = process.env.NEXT_PUBLIC_CONTACT_HANDLE || "@ptpofficialxd";
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfterSeconds?: number;
      };

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(`ลองใหม่ในอีก ${data.retryAfterSeconds ?? 60} วินาที`);
        }
        throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }

      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Login failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex w-full min-w-0 flex-1 items-center justify-center overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="aurora pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_center,rgba(0,0,0,0.8),transparent_70%)]" />

      <div className="w-full max-w-md min-w-0">
        <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 ring-1 ring-inset ring-white/10">
              <Icon name="lock" className="h-5 w-5 text-cyan-300" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Login{" — "}
              <span className="break-words bg-gradient-to-br from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                เอาน้อยนอนบ้าน
              </span>
            </h1>
            <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
              Developed by{" "}
              <a
                href="https://www.instagram.com/ptpofficialxd/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium !text-cyan-300 visited:!text-cyan-300 transition-colors hover:!text-cyan-200 hover:underline underline-offset-4"
              >
                {contact}
              </a>{" "}
              (กูว่าง)
            </p>

            {error ? (
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs leading-5 text-rose-200">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-rose-300" />
                  <span>{error}</span>
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor={emailId}
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Email
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  />
                  <Input
                    id={emailId}
                    type="email"
                    required
                    disabled={busy}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@email.com"
                    className="rounded-xl bg-white/5 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-500 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor={passwordId}
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Password
                </label>
                <div className="relative">
                  <Icon
                    name="lock"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  />
                  <Input
                    id={passwordId}
                    type="password"
                    required
                    disabled={busy}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••••••"
                    className="rounded-xl bg-white/5 pl-10 pr-4 text-zinc-100 placeholder:text-zinc-500 ring-1 ring-inset ring-white/10 transition-all hover:ring-white/20 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <Icon name="arrow-right" className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-zinc-500">
              สร้างมาแก้ไขปัญหาไอ้แก่บ้ากามชอบขอรูป 5TB จุกๆ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
