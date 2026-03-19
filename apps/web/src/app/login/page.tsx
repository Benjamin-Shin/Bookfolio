"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const action =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error: authError, data } = await action;

    if (authError) {
      setError(authError.message);
      setPending(false);
      return;
    }

    if (data.session) {
      await fetch("/api/auth/sync-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        })
      });
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage("가입 확인 메일을 확인한 뒤 다시 로그인해주세요.");
    }

    setPending(false);
  }

  return (
    <main className="shell" style={{ padding: "4rem 0" }}>
      <div className="splitPanel">
        <section className="panel" style={{ padding: "2rem" }}>
          <div className="eyebrow">Auth</div>
          <h1>이메일로 내 서재 시작하기</h1>
          <p className="muted">Bookfolio MVP는 이메일 로그인 기반으로 개인 컬렉션을 분리합니다.</p>
        </section>

        <section className="panel" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit} className="stack">
            <div className="inlineActions">
              <button
                type="button"
                className={mode === "signin" ? "button" : "buttonGhost"}
                onClick={() => setMode("signin")}
              >
                로그인
              </button>
              <button
                type="button"
                className={mode === "signup" ? "button" : "buttonGhost"}
                onClick={() => setMode("signup")}
              >
                회원가입
              </button>
            </div>
            <label className="field">
              이메일
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="field">
              비밀번호
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8자 이상"
                minLength={8}
                required
              />
            </label>
            {error ? <p style={{ color: "#a93418" }}>{error}</p> : null}
            {message ? <p style={{ color: "#2f6b4f" }}>{message}</p> : null}
            <button type="submit" className="button" disabled={pending}>
              {pending ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

