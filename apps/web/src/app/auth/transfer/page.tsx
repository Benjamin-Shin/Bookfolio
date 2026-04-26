"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function toSafeCallbackUrl(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/dashboard";
}

/**
 * 모바일에서 발급한 1회 코드를 받아 웹 NextAuth 세션으로 교환합니다.
 *
 * @history
 * - 2026-04-26: 신규 — `mobile-transfer` Credentials provider 자동 로그인 페이지
 */
function AuthTransferPageContent() {
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") ?? "").trim();
  const callbackUrl = useMemo(
    () => toSafeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams]
  );
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const [message, setMessage] = useState("모바일 로그인 정보를 확인하는 중…");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!code) {
        if (!cancelled) {
          setStatus("error");
          setMessage("전이 코드가 없습니다. 모바일 앱에서 다시 시도해 주세요.");
        }
        return;
      }
      const result = await signIn("mobile-transfer", {
        code,
        redirect: false,
        callbackUrl
      });
      if (cancelled) {
        return;
      }
      if (result?.ok && !result.error) {
        window.location.assign(callbackUrl);
        return;
      }
      setStatus("error");
      setMessage("코드가 만료되었거나 이미 사용되었습니다. 모바일 앱에서 다시 시도해 주세요.");
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [code, callbackUrl]);

  return (
    <main className="container flex min-h-[50vh] items-center justify-center py-12">
      <section className="w-full max-w-md rounded-xl border border-border/70 bg-card p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">모바일 로그인 연동</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        {status === "error" ? (
          <a
            href="/login"
            className="mt-4 inline-flex rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            로그인 화면으로 이동
          </a>
        ) : null}
      </section>
    </main>
  );
}

export default function AuthTransferPage() {
  return (
    <Suspense
      fallback={
        <main className="container flex min-h-[50vh] items-center justify-center py-12">
          <section className="w-full max-w-md rounded-xl border border-border/70 bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold">모바일 로그인 연동</h1>
            <p className="mt-3 text-sm text-muted-foreground">로그인 정보를 불러오는 중…</p>
          </section>
        </main>
      }
    >
      <AuthTransferPageContent />
    </Suspense>
  );
}
