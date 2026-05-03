"use client";

import { BOOK_FORMAT_LABEL_KO } from "@bookfolio/shared";
import type { UserBookDetail } from "@bookfolio/shared";

import {
  RatingChoiceFieldset,
  ReadingStatusChoiceFieldset,
} from "@/components/books/shelf-choice-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * 내 서가 `user_books` 필드만 상세 화면에서 바로 수정(POST `/api/me/books/:id`).
 *
 * @history
 * - 2026-05-03: 제목·안내를 「내 서가 기록」단일 조회·수정 UX로 정리; 서지 형식은 읽기 전용 표시
 * - 2026-05-03: 기존 `/dashboard/books/:id/edit` 폼을 상세로 이전
 */
export function BookShelfRecordInlineForm(props: {
  userBookId: string;
  userBook: Pick<
    UserBookDetail,
    | "format"
    | "readingStatus"
    | "rating"
    | "location"
    | "currentPage"
    | "readingTotalPages"
    | "isOwned"
  >;
}) {
  const { userBookId, userBook } = props;
  const formatLabel =
    BOOK_FORMAT_LABEL_KO[userBook.format] ?? userBook.format;

  return (
    <Card className="border-[#1A3C2F]/10 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-lg text-[#1A3C2F]">
          내 서가 기록
        </CardTitle>
        <CardDescription className="text-[#434843]">
          아래 값이 곧 현재 기록입니다. 바꾼 뒤 저장하면 반영됩니다. 장르·회원 평균 평점은 위 도서
          정보 패널을 참고하세요. 표지·가격·제목·매체 형식 등 공유 서지는 스태프 이상만 「서지
          편집」에서 수정합니다.
        </CardDescription>
        <p className="mt-2 text-sm text-[#675d53]">
          서지 형식(참고): <span className="font-medium text-[#1b1c19]">{formatLabel}</span>
        </p>
      </CardHeader>
      <CardContent>
        <form
          action={`/api/me/books/${userBookId}`}
          method="post"
          className="space-y-6"
        >
          <ReadingStatusChoiceFieldset
            defaultStatus={userBook.readingStatus}
          />
          <RatingChoiceFieldset defaultRating={userBook.rating ?? null} />
          <div className="space-y-2">
            <Label htmlFor="shelf-location">위치</Label>
            <Input
              id="shelf-location"
              name="location"
              placeholder="예: 집 책장 2층 / 회사"
              defaultValue={userBook.location ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shelf-current-page">현재까지 읽은 쪽</Label>
              <Input
                id="shelf-current-page"
                name="currentPage"
                type="number"
                min={0}
                step={1}
                placeholder="비우면 초기화"
                defaultValue={userBook.currentPage ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelf-reading-total">총 쪽(선택)</Label>
              <Input
                id="shelf-reading-total"
                name="readingTotalPages"
                type="number"
                min={1}
                step={1}
                placeholder="서지와 다를 때만"
                defaultValue={userBook.readingTotalPages ?? ""}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="shelf-is-owned"
              name="isOwned"
              type="checkbox"
              value="true"
              defaultChecked={userBook.isOwned}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="shelf-is-owned" className="font-normal">
              소장 중
            </Label>
          </div>
          <Button
            type="submit"
            className="bg-[#1A3C2F] text-white hover:bg-[#1A3C2F]/90"
          >
            저장
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
