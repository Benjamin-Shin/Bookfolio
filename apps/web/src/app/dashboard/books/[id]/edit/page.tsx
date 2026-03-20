import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BookFormatChoiceFieldset,
  RatingChoiceFieldset,
  ReadingStatusChoiceFieldset
} from "@/components/books/shelf-choice-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUserBookWithCanonical } from "@/lib/books/repository";

export default async function BookEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getUserBookWithCanonical(id);

  if (!row) {
    notFound();
  }

  const { userBook } = row;
  const displayTitle = userBook.title;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <Card className="border-border/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">내 서재 기록 수정</CardTitle>
            <CardDescription className="mt-1">
              「{displayTitle}」의 내 서재 필드(형식·상태·위치·메모 등)와, 참고 가격을 바꿀 수 있습니다.
              가격은 공유 도서(`books`)에 저장되어 합계에 반영됩니다.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/books/${userBook.id}`}>취소 · 상세로</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <form action={`/api/me/books/${userBook.id}`} method="post" className="space-y-6">
            <BookFormatChoiceFieldset defaultFormat={userBook.format} />
            <ReadingStatusChoiceFieldset defaultStatus={userBook.readingStatus} />
            <RatingChoiceFieldset defaultRating={userBook.rating ?? null} />
            <div className="space-y-2">
              <Label htmlFor="priceKrw">가격 (원)</Label>
              <p className="text-xs text-muted-foreground">
                공유 서지(`books`)의 참고 가격입니다. 비우면 지웁니다. 같은 ISBN을 쓰는 다른 사용자에게도
                보일 수 있습니다.
              </p>
              <Input
                id="priceKrw"
                type="number"
                name="priceKrw"
                min={0}
                step={1}
                defaultValue={userBook.priceKrw ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">위치</Label>
              <p className="text-xs text-muted-foreground">
                집, 회사, 빌려준 사람 등 이 권이 지금 어디 있는지 적어 두세요.
              </p>
              <Input
                id="location"
                name="location"
                placeholder="예: 집 책장 2층 / 회사 / 이모에게 빌려줌"
                defaultValue={userBook.location ?? ""}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isOwned"
                name="isOwned"
                type="checkbox"
                value="true"
                defaultChecked={userBook.isOwned}
                className="size-4 rounded border-input"
              />
              <Label htmlFor="isOwned" className="font-normal">
                소장 중
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Textarea id="memo" name="memo" rows={8} defaultValue={userBook.memo ?? ""} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">저장</Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/books/${userBook.id}`}>상세로 돌아가기</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
