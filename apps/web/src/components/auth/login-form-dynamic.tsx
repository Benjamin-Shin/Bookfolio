"use client";

import dynamic from "next/dynamic";

const LoginForm = dynamic(
  () => import("@/components/auth/login-form").then((m) => ({ default: m.LoginForm })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">로그인 화면을 불러오는 중…</p>
    )
  }
);

type LoginFormDynamicProps = {
  googleEnabled: boolean;
};

export function LoginFormDynamic({ googleEnabled }: LoginFormDynamicProps) {
  return <LoginForm googleEnabled={googleEnabled} />;
}
