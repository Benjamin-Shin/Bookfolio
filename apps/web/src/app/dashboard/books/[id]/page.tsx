import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUserBookWithCanonical } from "@/lib/books/repository";

const readingLabel: Record<string, string> = {
  unread: "읽기 전",
  reading: "읽는 중",
  completed: "완독",
  paused: "일시중단",
  dropped: "하차"
};

const formatLabel: Record<string, string> = {
  paper: "종이책",
  ebook: "전자책"
};

function isLikelyUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getUserBookWithCanonical(id);

  if (!row) {
    notFound();
  }

  const { userBook } = row;
  const displayTitle = userBook.title;
  const displayAuthors = userBook.authors.join(", ");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{displayTitle}</h1>
          <p className="mt-1 text-muted-foreground">{displayAuthors || "저자 미상"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">목록으로</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/books/${userBook.id}/edit`}>수정</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">도서 정보</CardTitle>
            <CardDescription>
              서재에 공유되는 도서 메타데이터(`books`)입니다. 제목·표지 등을 바꾸면 같은 ISBN을 쓰는 다른
              사용자 화면에도 반영될 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userBook.coverUrl ? (
              <div className="flex justify-center sm:justify-start">
                <img
                  src={userBook.coverUrl}
                  alt=""
                  className="max-h-64 max-w-[12rem] rounded-md border object-cover shadow-sm"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}

            <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr] sm:gap-x-4">
              <dt className="text-muted-foreground">ISBN</dt>
              <dd className="font-mono text-xs sm:text-sm">{userBook.isbn ?? "—"}</dd>
              <dt className="text-muted-foreground">출판사</dt>
              <dd>{userBook.publisher ?? "—"}</dd>
              <dt className="text-muted-foreground">출판일</dt>
              <dd>{userBook.publishedDate ?? "—"}</dd>
              <dt className="text-muted-foreground">가격</dt>
              <dd>
                {userBook.priceKrw != null
                  ? `${userBook.priceKrw.toLocaleString("ko-KR")}원`
                  : "—"}
              </dd>
              {userBook.catalogSource ? (
                <>
                  <dt className="text-muted-foreground">출처</dt>
                  <dd className="text-muted-foreground">{userBook.catalogSource}</dd>
                </>
              ) : null}
              {userBook.genreSlugs && userBook.genreSlugs.length > 0 ? (
                <>
                  <dt className="text-muted-foreground">장르</dt>
                  <dd className="text-muted-foreground">{userBook.genreSlugs.join(", ")}</dd>
                </>
              ) : null}
            </dl>

            {userBook.description ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">소개</p>
                {isLikelyUrl(userBook.description) ? (
                  <a
                    href={userBook.description}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    관련 링크 열기
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{userBook.description}</p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">내 서재 기록</CardTitle>
            <CardDescription>이 책에 대해 나만 가진 읽기 상태·메모 등입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr] sm:gap-x-4">
              <dt className="text-muted-foreground">형식</dt>
              <dd>{formatLabel[userBook.format] ?? userBook.format}</dd>
              <dt className="text-muted-foreground">읽기 상태</dt>
              <dd>{readingLabel[userBook.readingStatus] ?? userBook.readingStatus}</dd>
              <dt className="text-muted-foreground">평점</dt>
              <dd>{userBook.rating != null ? `${userBook.rating} / 5` : "—"}</dd>
              <dt className="text-muted-foreground">소장</dt>
              <dd>{userBook.isOwned ? "예" : "아니오"}</dd>
              <dt className="text-muted-foreground">위치</dt>
              <dd className="whitespace-pre-wrap">{userBook.location?.trim() ? userBook.location : "—"}</dd>
            </dl>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">메모</p>
              <p className="min-h-[4rem] whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                {userBook.memo?.trim() ? userBook.memo : "메모가 없습니다."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
          <p className="text-xs text-muted-foreground">삭제하면 내 서재에서만 제거됩니다.</p>
          <form action={`/api/me/books/${userBook.id}`} method="post">
            <input type="hidden" name="_method" value="DELETE" />
            <Button type="submit" variant="destructive" size="sm">
              내 서재에서 삭제
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
