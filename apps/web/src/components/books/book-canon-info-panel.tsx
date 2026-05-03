import { BookOneLinersInCanonPanel } from "@/components/books/book-one-liners-in-canon-panel.client";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

function isLikelyUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

/** 캐논 패널에 넘길 최소 필드(다른 화면에서도 동일 모양으로 재사용 가능). */
export type BookCanonInfoPanelData = {
  userBookId: string;
  bookId: string;
  title: string;
  coverUrl: string | null;
  isbn: string | null;
  publisher: string | null;
  publishedDate: string | null;
  priceKrw: number | null;
  description: string | null;
  catalogSource: string | null;
  genreSlugs: string[];
  /** 같은 서지에 평점을 남긴 회원들의 평균 */
  communityRatingAvg: number | null;
  communityRatingCount?: number;
};

/**
 * 공유 서지(`books`) 메타데이터 + 표지 + 소개 + 공개 한줄평.
 *
 * @history
 * - 2026-05-03: 장르 `Badge`는 shadcn `@/components/ui/badge`(lucide `Badge` 아이콘과 혼동 수정)
 * - 2026-05-03: 내 서가 도서 상세에서 분리, 한줄평 블록 통합
 */
export function BookCanonInfoPanel({ book }: { book: BookCanonInfoPanelData }) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#1A3C2F]/10 bg-white/90 shadow-[0_8px_30px_rgba(26,60,47,0.06)]"
      aria-labelledby="canon-info-heading"
    >
      <div className="border-b border-[#1A3C2F]/8 bg-gradient-to-br from-[#1A3C2F]/[0.04] to-transparent px-5 py-5 md:px-8 md:py-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#675d53]">
          Shared catalog
        </p>
        <h2
          id="canon-info-heading"
          className="mt-1 font-serif text-xl text-[#1A3C2F] md:text-2xl"
        >
          도서 정보
        </h2>
      </div>

      <div className="grid gap-4 px-5 py-6 md:px-8 md:py-4 lg:grid-cols-[min(220px,40%)_1fr] lg:gap-10">
        <div className="flex justify-center lg:justify-start">
          {book.coverUrl ? (
            <div className="relative w-[11rem] shrink-0 overflow-hidden rounded-xl border border-[#1A3C2F]/12 shadow-md sm:w-[12.5rem]">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="aspect-[2/3] w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex aspect-[2/3] w-[11rem] items-center justify-center rounded-xl border border-dashed border-[#1A3C2F]/20 bg-[#F8F9FA] text-xs text-[#675d53] sm:w-[12.5rem]">
              표지 없음
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <CanonField label="ISBN" value={book.isbn ?? "—"} mono />
            <CanonField
              label="참고 가격"
              value={
                book.priceKrw != null
                  ? `${book.priceKrw.toLocaleString("ko-KR")}원`
                  : "—"
              }
            />
            <CanonField label="출판사" value={book.publisher ?? "—"} />
            <CanonField label="출판일" value={book.publishedDate ?? "—"} />
            <CanonField
              label="회원평균평점"
              value={
                formatCommunityRating(
                  book.communityRatingAvg,
                  book.communityRatingCount,
                ) ?? "—"
              }
            />
            <div className="rounded-xl border border-[#1A3C2F]/10 bg-white/80 p-4">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[#675d53]">
                장르
              </p>
              {book.genreSlugs.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {book.genreSlugs.map((slug) => (
                    <Badge
                      key={slug}
                      variant="secondary"
                      className="border-[#1A3C2F]/15 bg-[#F8F9FA] font-normal text-[#434843]"
                    >
                      {slug}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#675d53]">
                  등록된 장르가 없습니다.
                </p>
              )}
            </div>
          </div>

          {book.description ? (
            <div className="rounded-xl border border-[#1A3C2F]/10 bg-[#F8F9FA]/50 p-4 md:p-5">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#675d53]">
                소개
              </p>
              {isLikelyUrl(book.description) ? (
                <a
                  href={book.description}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-sm font-medium text-[#1A3C2F] underline-offset-4 hover:underline"
                >
                  관련 링크 열기
                </a>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#434843]">
                  {book.description}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[#1A3C2F]/8 px-5 py-6 md:px-8 md:py-8">
        <BookOneLinersInCanonPanel
          userBookId={book.userBookId}
          bookId={book.bookId}
        />
      </div>
    </section>
  );
}

/**
 * 회원 평균 평점 한 줄 표시.
 *
 * @history
 * - 2026-05-03: `BookCanonInfoPanel`에서 사용
 */
function formatCommunityRating(
  avg: number | null | undefined,
  count: number | undefined,
): string {
  const n = typeof count === "number" && count > 0 ? count : 0;
  if (avg == null || !Number.isFinite(avg) || n === 0) {
    return "아직 집계된 평점이 없습니다";
  }
  return `${avg.toFixed(2)} / 5 · ${n.toLocaleString("ko-KR")}명`;
}

function CanonField(props: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  className?: string;
}) {
  const { label, value, mono, muted, className } = props;
  return (
    <div
      className={`rounded-lg border border-[#1A3C2F]/8 bg-[#F8F9FA]/40 px-3 py-2.5 ${className ?? ""}`}
    >
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[#675d53]">
        {label}
      </p>
      <p
        className={`mt-1 text-sm ${mono ? "font-mono text-xs sm:text-sm" : ""} ${muted ? "text-[#675d53]" : "font-medium text-[#1b1c19]"}`}
      >
        {value}
      </p>
    </div>
  );
}
