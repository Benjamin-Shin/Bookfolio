"use client";

/**
 * 이메일·구글·카카오(에셋) 로그인 폼.
 *
 * @history
 * - 2026-04-12: 구글 공식 Web PNG(`/assets/google_signin_light_sq_si.png`·`google_signup_light_sq_su.png`) — 로그인/가입 탭별 SI·SU; 카카오와 동일 52px 높이 `object-contain`
 * - 2026-04-12: 카카오 공식 PNG(`/assets/kakao_login_medium_narrow.png`)·모바일과 동일 순서·183×45 비율 너비 컬럼; 카카오 OAuth 미연동 시 안내
 * - 2026-04-05: 로그인 탭 — 라벨·힌트「이메일 또는 아이디」, @ 앞 로컬만 입력 가능(`type="text"`)
 * - 2026-04-05: 카드 제목 서가담·에디토리얼 타이포(`font-serif`)
 * - 2026-03-24: Credentials 로그인 성공 후 `router.push` 대신 `location.assign`으로 이동 — 미들웨어 `auth()`가 클라이언트 전환 직후 쿠키를 못 읽어 `/login`으로 되튕기던 현상 수정
 */

import type { Route } from "next";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  googleEnabled: boolean;
};

function toSafeCallbackUrl(raw: string | null): Route {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw as Route;
  }
  return "/dashboard";
}

/** 공식 `kakao_login_medium_narrow` 원본 183×45; 슬롯 높이 52px에 맞춘 가로 길이(모바일 `sign_in_screen`과 동일). */
const kakaoAlignedColumnClass = "mx-auto w-[min(100%,calc(183*52px/45))]";

/** Google Branding `web_light_sq_*@2x` 고유 픽셀(복사본 `public/assets/`). */
const GOOGLE_SIGNIN_ASSET_PX = { w: 350, h: 80 } as const;
const GOOGLE_SIGNUP_ASSET_PX = { w: 358, h: 80 } as const;

type OauthContinueBlockProps = {
  googleEnabled: boolean;
  pending: boolean;
  callbackUrl: Route;
  /** 로그인 탭이면 SI, 회원가입 탭이면 SU 에셋. */
  googleAsset: "signin" | "signup";
  primarySlot: React.ReactNode;
  onKakaoClick: () => void;
};

function OauthContinueBlock({
  googleEnabled,
  pending,
  callbackUrl,
  googleAsset,
  primarySlot,
  onKakaoClick
}: OauthContinueBlockProps) {
  return (
    <div className={cn("flex flex-col gap-8", kakaoAlignedColumnClass)}>
      {primarySlot}
      <div className="flex flex-col gap-6">
        <p className="text-center text-xs text-muted-foreground opacity-[0.45]">
          또는 다음으로 계속하기
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onKakaoClick}
            className="relative flex h-[52px] w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent bg-transparent p-0 transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Image
              src="/assets/kakao_login_medium_narrow.png"
              alt="카카오 로그인"
              width={183}
              height={45}
              className="h-[52px] w-auto max-w-full object-contain object-center"
              priority
            />
          </button>
          {googleEnabled ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => signIn("google", { callbackUrl })}
              className="relative flex h-[52px] w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-transparent bg-transparent p-0 transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Image
                src={
                  googleAsset === "signup"
                    ? "/assets/google_signup_light_sq_su.png"
                    : "/assets/google_signin_light_sq_si.png"
                }
                alt={googleAsset === "signup" ? "Google 계정으로 가입하기" : "Google 계정으로 로그인"}
                width={
                  googleAsset === "signup" ? GOOGLE_SIGNUP_ASSET_PX.w : GOOGLE_SIGNIN_ASSET_PX.w
                }
                height={
                  googleAsset === "signup" ? GOOGLE_SIGNUP_ASSET_PX.h : GOOGLE_SIGNIN_ASSET_PX.h
                }
                className="h-[52px] w-auto max-w-full object-contain object-center"
                priority
              />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ googleEnabled }: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = toSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    setInfo(null);
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl
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
    setInfo(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined
        })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
        setPending(false);
        return;
      }
      setMessage("가입되었습니다. 로그인 중…");
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl
      });
      if (!result?.ok || result.error) {
        setError("가입은 완료되었으나 로그인에 실패했습니다. 다시 시도해주세요.");
        setPending(false);
        return;
      }
      window.location.assign(callbackUrl);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setPending(false);
  }

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <Card className="border-border/80 shadow-lg">
        <CardHeader>
          <CardTitle className="font-serif text-2xl font-medium">
            서가담 로그인
          </CardTitle>
          <CardDescription>
            이메일·비밀번호로 로그인하거나 소셜 계정으로 계속할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "signin" | "signup");
              setError(null);
              setInfo(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4 space-y-4">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Label htmlFor="signin-email">이메일 또는 아이디</Label>
                    <span className="text-muted-foreground text-xs">
                      이메일 @ 앞 아이디(영문·숫자 등)만으로도 로그인할 수 있습니다.
                    </span>
                  </div>
                  <Input
                    id="signin-email"
                    type="text"
                    autoComplete="username"
                    inputMode="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="you@example.com 또는 아이디"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">비밀번호</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="8자 이상"
                    minLength={8}
                    required
                  />
                </div>
                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>오류</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                {info ? (
                  <Alert>
                    <AlertTitle>알림</AlertTitle>
                    <AlertDescription>{info}</AlertDescription>
                  </Alert>
                ) : null}
                <OauthContinueBlock
                  googleEnabled={googleEnabled}
                  pending={pending}
                  callbackUrl={callbackUrl}
                  googleAsset="signin"
                  onKakaoClick={() => setInfo("카카오 로그인은 준비 중입니다.")}
                  primarySlot={
                    <Button type="submit" className="h-[52px] w-full" disabled={pending}>
                      {pending ? "처리 중…" : "로그인"}
                    </Button>
                  }
                />
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-4 space-y-4">
              <form onSubmit={onSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">이름 (선택)</Label>
                  <Input
                    id="signup-name"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    placeholder="표시 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">이메일</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="8자 이상"
                    minLength={8}
                    required
                  />
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
                {info ? (
                  <Alert>
                    <AlertTitle>알림</AlertTitle>
                    <AlertDescription>{info}</AlertDescription>
                  </Alert>
                ) : null}
                <OauthContinueBlock
                  googleEnabled={googleEnabled}
                  pending={pending}
                  callbackUrl={callbackUrl}
                  googleAsset="signup"
                  onKakaoClick={() => setInfo("카카오 로그인은 준비 중입니다.")}
                  primarySlot={
                    <Button type="submit" className="h-[52px] w-full" disabled={pending}>
                      {pending ? "처리 중…" : "가입하고 로그인"}
                    </Button>
                  }
                />
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
