import { Suspense } from "react";

import { LoginFormDynamic } from "@/components/auth/login-form-dynamic";

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID?.trim());

  return (
    <main className="container flex flex-col items-center py-12 md:py-20">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">로그인 화면을 불러오는 중…</p>}
      >
        <LoginFormDynamic googleEnabled={googleEnabled} />
      </Suspense>
    </main>
  );
}
