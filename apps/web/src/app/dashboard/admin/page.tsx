import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">관리자</h1>
        <p className="mt-1 text-sm text-muted-foreground">계정·공유 도서 메타데이터를 관리합니다.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">사용자 관리</CardTitle>
            <CardDescription>가입 계정 목록과 ADMIN / USER 권한을 변경합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/users" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              사용자 목록 열기
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">도서 관리</CardTitle>
            <CardDescription>공유 서지(`books`) 테이블을 검색·열람합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/books" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              도서 목록 열기
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
