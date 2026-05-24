import Link from "next/link";

import { NewBookForm } from "@/components/books/new-book-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 내 서가 — 책 수동 등록.
 *
 * @history
 * - 2026-05-24: 대시보드 공통 `max-w-6xl` 셸·헤더 블록으로 너비·정렬 통일
 */
export default function NewBookPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1b1c19] selection:bg-[#c5e6d4] selection:text-[#0f241c]">
      <main className="px-4 pb-28 pt-8 md:px-8 md:pb-24 md:pt-10 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-8 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#675d53]">
                  My Library
                </p>
                <h1 className="font-serif text-3xl text-[#1A3C2F] md:text-4xl">책 수동 등록</h1>
                <p className="max-w-2xl text-sm text-[#434843]">
                  ISBN으로 메타데이터를 불러오거나, 직접 입력해 등록할 수 있습니다. 바코드 스캔은
                  모바일 앱에서 지원합니다.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full shrink-0 border-[#1A3C2F]/25 bg-white/80 text-[#1A3C2F] hover:bg-white sm:w-auto"
              >
                <Link href="/dashboard">목록으로</Link>
              </Button>
            </div>
          </header>

          <Card className="border-border/80 bg-white/90 shadow-sm">
            <CardHeader className="sr-only">
              <CardTitle>등록 폼</CardTitle>
              <CardDescription>책 정보를 입력해 내 서가에 추가합니다.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <NewBookForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
