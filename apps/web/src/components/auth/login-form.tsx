"use client";

/**
 * 시안 기반 웹 로그인 페이지.
 *
 * @history
 * - 2026-04-27: 구글 버튼을 `Google.svg` 아이콘+텍스트형으로 교체, 카카오 버튼은 환경변수 없어도 비활성 상태로 표시
 * - 2026-04-27: 웹 로그인 시안 반영 — 좌측 비주얼/우측 카드/하단 안내 바 레이아웃으로 개편, 로그인 중심 UX로 단순화
 * - 2026-04-24: 카카오 OAuth 연동 — `kakaoEnabled`일 때 `signIn("kakao", { callbackUrl })` 실행
 * - 2026-04-12: 구글 공식 Web PNG(`/assets/google_signin_light_sq_si.png`·`google_signup_light_sq_su.png`) — 로그인/가입 탭별 SI·SU; 카카오와 동일 52px 높이 `object-contain`
 * - 2026-04-12: 카카오 공식 PNG(`/assets/Kakao.svg`)·모바일과 동일 순서·183×45 비율 너비 컬럼; 카카오 OAuth 미연동 시 안내
 * - 2026-04-05: 로그인 탭 — 라벨·힌트「이메일 또는 아이디」, @ 앞 로컬만 입력 가능(`type="text"`)
 * - 2026-04-05: 카드 제목 서가담·에디토리얼 타이포(`font-serif`)
 * - 2026-03-24: Credentials 로그인 성공 후 `router.push` 대신 `location.assign`으로 이동 — 미들웨어 `auth()`가 클라이언트 전환 직후 쿠키를 못 읽어 `/login`으로 되튕기던 현상 수정
 */

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  googleEnabled: boolean;
  kakaoEnabled: boolean;
};

function toSafeCallbackUrl(raw: string | null): Route {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw as Route;
  }
  return "/dashboard";
}

export function LoginForm({ googleEnabled, kakaoEnabled }: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = toSafeCallbackUrl(searchParams.get("callbackUrl"));
  const mode = searchParams.get("mode");
  const defaultAuthMode = mode === "signup" ? "signup" : "signin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [keepLogin, setKeepLogin] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">(
    defaultAuthMode,
  );

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (!result?.ok || result.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    window.location.assign(callbackUrl);
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
        setPending(false);
        return;
      }
      setMessage("가입이 완료되었습니다. 로그인 중…");
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (!result?.ok || result.error) {
        setError("가입은 완료되었으나 로그인에 실패했습니다.");
        setPending(false);
        return;
      }
      window.location.assign(callbackUrl);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <section className="overflow-hidden rounded-[26px] border border-[#ddd] bg-[#efefec] shadow-[0_14px_30px_rgba(17,17,17,0.08)]">
        <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative hidden bg-[#1f2d1f] text-white lg:flex">
            <Image
              src="/assets/Web-Login-back.png"
              alt=""
              fill
              className="object-cover"
              priority
            />
          </aside>

          <div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10">
            <div className="w-full max-w-[470px] rounded-3xl border border-[#e3e4df] bg-white p-7 shadow-[0_12px_35px_rgba(20,20,20,0.08)] sm:p-9">
              <div className="mb-7 flex flex-col items-center gap-2 text-center">
                <Image
                  src="/assets/seogadam_logo.png"
                  alt="서가담"
                  width={168}
                  height={72}
                  priority
                />
                <p className="text-[17px] text-[#6a7067]">당신의 서가를 담다</p>
              </div>

              <form
                onSubmit={authMode === "signup" ? onSignUp : onSignIn}
                className="space-y-4"
              >
                {authMode === "signup" ? (
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="sr-only">
                      이름
                    </Label>
                    <Input
                      id="signup-name"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      placeholder="이름을 입력해주세요 (선택)"
                      className="h-12 rounded-lg border-[#e6e6e1] bg-white px-4 text-[15px]"
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="sr-only">
                    이메일 또는 아이디
                  </Label>
                  <Input
                    id="signin-email"
                    type="text"
                    autoComplete="username"
                    inputMode="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="이메일을 입력해주세요"
                    className="h-12 rounded-lg border-[#e6e6e1] bg-white px-4 text-[15px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="sr-only">
                    비밀번호
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="비밀번호를 입력해주세요"
                    className="h-12 rounded-lg border-[#e6e6e1] bg-white px-4 text-[15px]"
                    minLength={8}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label
                    htmlFor="keep-login"
                    className="flex cursor-pointer items-center gap-2 text-[#6f726d]"
                  >
                    <Checkbox
                      id="keep-login"
                      checked={keepLogin}
                      onCheckedChange={(checked) =>
                        setKeepLogin(checked === true)
                      }
                      className="border-[#cfd3cc] data-[state=checked]:border-[#1f6c3f] data-[state=checked]:bg-[#1f6c3f]"
                    />
                    로그인 상태 유지
                  </label>
                  <span className="text-[#5e765f]">비밀번호 찾기</span>
                </div>

                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>오류</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                {message ? (
                  <Alert>
                    <AlertTitle>알림</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-lg bg-[#1f6c3f] text-base font-semibold hover:bg-[#1a5b36]"
                  disabled={pending}
                >
                  {pending
                    ? "처리 중…"
                    : authMode === "signup"
                      ? "가입하고 로그인"
                      : "로그인"}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#e4e5e1]" />
                <span className="text-sm text-[#878b84]">또는</span>
                <span className="h-px flex-1 bg-[#e4e5e1]" />
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={pending || !googleEnabled}
                  onClick={() => {
                    if (!googleEnabled) return;
                    signIn("google", { callbackUrl });
                  }}
                  className="relative flex h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-[#e2e3de] bg-white text-[15px] font-medium text-[#3c4043] transition-colors hover:bg-[#f9faf9] disabled:pointer-events-none disabled:opacity-50"
                >
                  <Image
                    src="/assets/Google.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                    priority
                  />
                  <span>구글로 시작하기</span>
                </button>

                <button
                  type="button"
                  disabled={pending || !kakaoEnabled}
                  onClick={() => {
                    if (!kakaoEnabled) return;
                    signIn("kakao", { callbackUrl });
                  }}
                  className="relative flex h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-[#e2e3de] bg-[#FEE500] text-[15px] font-medium text-[#191919] transition-colors hover:bg-[#f4db00] disabled:pointer-events-none disabled:opacity-50"
                >
                  <Image
                    src="/assets/Kakao.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                    priority
                  />
                  <span>카카오로 시작하기</span>
                </button>
              </div>

              <p className="mt-7 text-center text-sm text-[#727671]">
                {authMode === "signin"
                  ? "아직 계정이 없으신가요?"
                  : "이미 계정이 있으신가요?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-[#37644b] hover:underline"
                  onClick={() => {
                    setAuthMode((prev) =>
                      prev === "signin" ? "signup" : "signin",
                    );
                    setError(null);
                    setMessage(null);
                  }}
                >
                  {authMode === "signin" ? "회원가입" : "로그인"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
