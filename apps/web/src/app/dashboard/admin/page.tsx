/**
 * @history
 * - 2026-04-10: 클라이언트 오류 수집 카드
 * - 2026-03-29: 상단 플랫폼 통계 카드(`fetchAdminDashboardStats`) 추가
 * - 2026-03-29: 공동서가 관리 카드 추가
 * - 2026-03-26: 포인트·정책 카드 추가
 */
import Link from "next/link";
import type { Route } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAdminDashboardStats } from "@/lib/admin/admin-dashboard-stats";

const koInt = new Intl.NumberFormat("ko-KR");

function StatTile({
  title,
  description,
  value,
  footnote,
}: {
  title: string;
  description: string;
  value: number;
  footnote?: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {koInt.format(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {footnote ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground/90">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}

export default async function AdminHomePage() {
  const stats = await fetchAdminDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">관리자</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          계정·공유 도서 메타데이터를 관리합니다.
        </p>
      </div>

      <section aria-label="플랫폼 통계">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          플랫폼 통계
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            title="가입 사용자"
            description="앱 사용자(app_users) 전체 계정 수"
            value={stats.userCount}
          />
          <StatTile
            title="공동서가"
            description="모임·공유 서가(libraries) 개수"
            value={stats.sharedLibraryCount}
          />
          <StatTile
            title="캐논 도서"
            description="공유 서지 books 테이블 총 권수"
            value={stats.canonicalBookCount}
          />
          <StatTile
            title="개인 소장 행"
            description="회원별 소장 user_books 총 행 수"
            value={stats.userBookRowCount}
          />
          <StatTile
            title="저자 마스터"
            description="authors 테이블 등록 수"
            value={stats.authorCount}
          />
          <StatTile
            title="유효 VIP 구독"
            description="활성 상태이며 기간 만료 전인 구독 행 수"
            value={stats.activeVipSubscriptionCount}
            footnote="동일 회원에 활성 행이 여러 개면 합계에 중복이 생길 수 있습니다."
          />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">사용자 관리</CardTitle>
            <CardDescription>
              가입 계정 목록과 ADMIN / USER 권한을 변경합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/admin/users"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              사용자 목록 열기
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">도서 관리</CardTitle>
            <CardDescription>
              공유 서지(`books`) 테이블을 검색·열람합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/admin/books"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              도서 목록 열기
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">저자 관리</CardTitle>
            <CardDescription>
              저자 마스터(`authors`)와 도서 연결(`book_authors`) 데이터를
              봅니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={"/dashboard/admin/authors" as Route}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              저자 목록 열기
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">포인트 · 정책</CardTitle>
            <CardDescription>
              정책 버전·이벤트 규칙(`point_rule_versions` / `point_rules`)과
              원장(`user_points_ledger`)을 조회합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/admin/points"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              포인트 화면 열기
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">클라이언트 오류</CardTitle>
            <CardDescription>
              앱·웹이 전송한 오류 로그를 최신순으로 봅니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/admin/client-errors"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              오류 목록 열기
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">공동서가</CardTitle>
            <CardDescription>
              공동서가 목록, 참여 회원, 연결 도서 권수를 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={"/dashboard/admin/shared-libraries" as Route}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              공동서가 목록 열기
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
