import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserFeedbackForm } from "@/components/feedback/user-feedback-form.client";

/**
 * 로그인 사용자 의견 보내기.
 *
 * @history
 * - 2026-05-18: 신규
 */
export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/feedback");
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 pb-28 pt-8 text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c] md:px-8 md:pb-24 md:pt-10 lg:px-12">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
            Feedback
          </p>
          <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">의견 보내기</h1>
          <p className="text-sm text-[#434843]">
            버그, 기능 제안, 사용 중 불편한 점을 알려 주세요.{" "}
            <Link
              href="/dashboard"
              className="underline underline-offset-4 hover:text-[#1A3C2F]"
            >
              내 서가로 돌아가기
            </Link>
          </p>
        </header>

        <UserFeedbackForm defaultContactEmail={session.user.email ?? null} />
      </div>
    </main>
  );
}
