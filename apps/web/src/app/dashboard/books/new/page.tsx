import Link from "next/link";

import { NewBookForm } from "@/components/books/new-book-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewBookPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>책 수동 등록</CardTitle>
            <CardDescription>
              ISBN으로 메타데이터를 불러오거나, 직접 입력해 등록할 수 있습니다. 바코드 스캔은 모바일 앱에서 지원합니다.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">목록으로</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <NewBookForm />
        </CardContent>
      </Card>
    </main>
  );
}
