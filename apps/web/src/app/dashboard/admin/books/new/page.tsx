import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminBookPrefillFromSearchParams } from "@/lib/aladin/admin-book-prefill";

import { AdminCanonicalBookForm } from "../admin-canonical-book-form";

/**
 * @history
 * - 2026-03-25: 쿼리스트링으로 폼 프리필(알라딘 빠른 추가 등)
 */
export default async function AdminNewBookPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const defaultValues = adminBookPrefillFromSearchParams(sp);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">도서 추가</h1>
          <p className="mt-1 text-sm text-muted-foreground">공유 서지(`books`)에 새 행을 만듭니다.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin/books">목록으로</Link>
        </Button>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>메타데이터</CardTitle>
          <CardDescription>ISBN은 고유해야 합니다. 비우면 ISBN 없이 등록할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminCanonicalBookForm mode="create" defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  );
}
