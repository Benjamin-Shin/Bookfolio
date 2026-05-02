"use client";

/**
 * 시안 기반 웹 로그인 페이지.
 *
 * @history
 * - 2026-05-03: Stitch `lh3` 배경·로고를 `public/assets` PNG로 받아 로컬 경로 사용(만료·차단 없이 제공)
 * - 2026-05-03: 좌측 상단 브랜드 마크를 Stitch 시안 동일 `lh3` 로고 이미지로 전환
 * - 2026-05-03: 좌측 배경을 Stitch 시안 동일 `lh3` 이미지로 전환, `next.config` `remotePatterns` 연동
 * - 2026-05-03: Stitch「Concept Landing Page」—「서가담 로그인 페이지 (어두운 배경)」좌측 패널 반영(반폭·그라데이션·헤드카피·명언·로고 행)
 * - 2026-05-02: 참고 시안 스플릿 레이아웃 — 좌측 배너 고정 폭(`min(50vw,560px)`), 우측 `flex-1` 반응형, 색상·프로모 배너·명언 블록 정리
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
import { GiftIcon, LockIcon, MailIcon } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Stitch 시안 동일 자산 — `curl`로 원본 URL에서 받아 둔 파일 */
const STITCH_LOGIN_PANEL_IMAGE = "/assets/stitch-login-dark-panel-bg.png" as const;
const STITCH_LOGIN_BRAND_LOGO =
  "/assets/stitch-login-dark-brand-logo.png" as const;

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
    <div className="flex min-h-full w-full flex-1 flex-col lg:flex-row lg:min-h-0">
      <section
        className="relative hidden min-h-[280px] w-full shrink-0 overflow-hidden bg-gray-900 lg:flex lg:min-h-full lg:w-1/2"
        aria-label="서가담 소개"
      >
        <Image
          src={STITCH_LOGIN_PANEL_IMAGE}
          alt="고급스러운 서재 분위기의 배경"
          fill
          className="object-cover opacity-60"
          priority
          sizes="(min-width: 1024px) 50vw, 0px"
        />
        <div
          className="absolute inset-0 z-[5] bg-gradient-to-r from-black/80 via-black/40 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex h-full min-h-[280px] flex-col p-8 text-white sm:p-10 lg:min-h-0 lg:p-12">
          <div className="flex shrink-0 items-center gap-3">
            <Image
              src={STITCH_LOGIN_BRAND_LOGO}
              alt="서가담 로고"
              width={40}
              height={40}
              className="size-10 object-contain"
              priority
            />
            <span className="font-serif text-2xl font-semibold tracking-wide text-white">
              서가담
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center py-8 lg:py-10">
            <div className="max-w-md">
              <h1 className="mb-6 font-serif text-3xl font-medium leading-tight sm:text-4xl">
                로그인하고
                <br />
                나만의 서가를
                <br />
                시작해보세요
              </h1>
              <p className="mb-10 text-base leading-relaxed text-gray-200 sm:mb-12 sm:text-lg">
                읽고, 기록하고, 쌓아가는
                <br />
                당신만의 독서 공간
              </p>
              <div className="mt-2 lg:mt-4">
                <span
                  className="font-serif text-5xl leading-none text-[#1f4529] opacity-80"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p className="mt-2 font-serif text-lg sm:text-xl">
                  오늘 한 페이지가
                  <br />
                  인생을 바꾼다
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex flex-1 flex-col items-center bg-[#f5f3ef] px-4 py-10 sm:px-8 lg:min-h-0 lg:justify-center lg:py-12">
        <div className="pointer-events-none absolute left-1/2 top-6 z-10 w-full max-w-md -translate-x-1/2 px-2 sm:top-8">
          <div className="pointer-events-auto flex items-center justify-center gap-2 rounded-md bg-[#e9eee6] px-4 py-2.5 text-center text-sm font-medium text-[#3a5a40] shadow-sm">
            <GiftIcon className="size-4 shrink-0" aria-hidden />
            <span>
              로그인하고 <strong className="mx-0.5 font-semibold">10P</strong>를
              받아보세요!
            </span>
          </div>
        </div>

        <div className="mt-14 w-full max-w-md rounded-2xl border border-[#e5e5e5] bg-white p-8 shadow-lg sm:p-10 lg:mt-6">
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <svg
                className="size-8 shrink-0 fill-[#1f4529]"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <h2 className="text-3xl font-bold tracking-wide text-[#333333]">
                서가담
              </h2>
            </div>
            <p className="text-sm text-[#666666]">당신의 서가를 담다</p>
          </div>

          <form
            onSubmit={authMode === "signup" ? onSignUp : onSignIn}
            className="space-y-5"
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
                  className="h-12 rounded-lg border-[#e5e5e5] bg-white px-4 text-sm placeholder:text-neutral-400 focus-visible:border-[#1f4529] focus-visible:ring-[#1f4529]"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="signin-email" className="sr-only">
                이메일 또는 아이디
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                  <MailIcon className="size-5" aria-hidden />
                </span>
                <Input
                  id="signin-email"
                  type="text"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="이메일을 입력해주세요"
                  className="h-12 rounded-lg border-[#e5e5e5] bg-white py-3 pl-11 pr-3 text-sm placeholder:text-neutral-400 focus-visible:border-[#1f4529] focus-visible:ring-[#1f4529]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password" className="sr-only">
                비밀번호
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                  <LockIcon className="size-5" aria-hidden />
                </span>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                  className="h-12 rounded-lg border-[#e5e5e5] bg-white py-3 pl-11 pr-3 text-sm placeholder:text-neutral-400 focus-visible:border-[#1f4529] focus-visible:ring-[#1f4529]"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <label
                htmlFor="keep-login"
                className="flex cursor-pointer items-center gap-2 text-[#666666]"
              >
                <Checkbox
                  id="keep-login"
                  checked={keepLogin}
                  onCheckedChange={(checked) => setKeepLogin(checked === true)}
                  className="border-neutral-300 data-[state=checked]:border-[#1f4529] data-[state=checked]:bg-[#1f4529]"
                />
                로그인 상태 유지
              </label>
              <span className="font-medium text-[#1f4529]">비밀번호 찾기</span>
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

            <div className="pt-1">
              <Button
                type="submit"
                className="h-12 w-full rounded-lg bg-[#1f4529] text-sm font-medium text-white shadow-sm hover:bg-[#15321f] focus-visible:ring-2 focus-visible:ring-[#1f4529] focus-visible:ring-offset-2"
                disabled={pending}
              >
                {pending
                  ? "처리 중…"
                  : authMode === "signup"
                    ? "가입하고 로그인"
                    : "로그인"}
              </Button>
            </div>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs font-medium">
              <span className="bg-white px-3 text-neutral-400">또는</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              disabled={pending || !googleEnabled}
              onClick={() => {
                if (!googleEnabled) return;
                signIn("google", { callbackUrl });
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Image
                src="/assets/Google.svg"
                alt=""
                width={20}
                height={20}
                className="size-5"
                priority
              />
              Google로 로그인
            </button>

            <button
              type="button"
              disabled={pending || !kakaoEnabled}
              onClick={() => {
                if (!kakaoEnabled) return;
                signIn("kakao", { callbackUrl });
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-[#fee500] text-sm font-medium text-black shadow-sm transition-colors hover:bg-[#ebd300] disabled:pointer-events-none disabled:opacity-50"
            >
              <Image
                src="/assets/Kakao.svg"
                alt=""
                width={20}
                height={20}
                className="size-5"
                priority
              />
              카카오로 로그인
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-[#666666]">
            {authMode === "signin"
              ? "아직 계정이 없으신가요?"
              : "이미 계정이 있으신가요?"}{" "}
            <button
              type="button"
              className="font-bold text-[#1f4529] transition-colors hover:text-[#15321f] hover:underline"
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
      </section>
    </div>
  );
}
