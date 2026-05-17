"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const contact = process.env.NEXT_PUBLIC_CONTACT_HANDLE || "@aownoinonbaan";
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
    <div className="relative flex min-h-[calc(100vh-9rem)] items-center justify-center px-6 py-16">
      <div className="aurora absolute inset-0 -z-20 opacity-90" />
      <div className="grid-bg absolute inset-0 -z-10 opacity-35 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <Icon name="arrow-right" className="h-4 w-4 rotate-180" />
          Back to vault
        </Link>

        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_40px_120px_-70px_rgba(34,211,238,0.8)] backdrop-blur-2xl">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300/20 to-blue-500/20 ring-1 ring-inset ring-white/10">
            <Icon name="lock" className="h-6 w-6 text-cyan-200" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.05rem]">
            เข้าสู่ระบบ{" "}
            <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              เอาน้อยนอนบ้าน
            </span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            พื้นที่นี้ใช้กันเฉพาะในกลุ่มเท่านั้น ถ้ายังไม่มีบัญชี ให้ติดต่อ {contact}
          </p>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor={emailId}
                className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500"
              >
                email
              </label>
              <Input
                id={emailId}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor={passwordId}
                className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500"
              >
                password
              </label>
              <Input
                id={passwordId}
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={busy} className="w-full">
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
