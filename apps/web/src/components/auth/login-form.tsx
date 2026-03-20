"use client";

import type { Route } from "next";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LoginFormProps = {
  googleEnabled: boolean;
};

function toSafeCallbackUrl(raw: string | null): Route {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw as Route;
  }
  return "/dashboard";
}

export function LoginForm({ googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = toSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl
    });
    setPending(false);
    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
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
      if (result?.error) {
        setError("가입은 완료되었으나 로그인에 실패했습니다. 다시 시도해주세요.");
        setPending(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setPending(false);
  }

  return (
    <div className="mx-auto grid w-full max-w-lg gap-6">
      <Card className="border-border/80 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Bookfolio 로그인</CardTitle>
          <CardDescription>이메일·비밀번호 또는 구글로 내 서재에 접속하세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {googleEnabled ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={() => signIn("google", { callbackUrl })}
              >
                Google로 계속하기
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">또는 이메일</span>
                </div>
              </div>
            </>
          ) : null}

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4 space-y-4">
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">이메일</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="you@example.com"
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
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "처리 중…" : "로그인"}
                </Button>
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
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "처리 중…" : "가입하고 로그인"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
