import type { LibraryAggregatedBookRow, LibraryMemberRow } from "@bookfolio/shared";
import type { Route } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { normalizeCoverUrlForClient } from "@/lib/books/cover-url";
import { cn } from "@/lib/utils";

export interface LibraryMemberReadingSectionProps {
  libraryId: string;
  members: LibraryMemberRow[];
  books: LibraryAggregatedBookRow[];
}

/**
 * 모임서가 — 회원별「읽는 중」소장 목록(표지·제목 링크).
 *
 * @history
 * - 2026-05-04: 신규
 */
export function LibraryMemberReadingSection({
  libraryId,
  members,
  books,
}: LibraryMemberReadingSectionProps) {
  return (
    <section
      className="flex h-full min-h-[280px] flex-col rounded-2xl border border-[#1A3C2F]/8 bg-white p-5 shadow-[0_8px_30px_rgba(26,60,47,0.06)] md:p-6"
      aria-labelledby="lib-member-reading-title"
    >
      <div className="mb-4 flex items-center gap-2 border-b border-[#1A3C2F]/8 pb-3">
        <BookOpen className="size-5 text-[#1A3C2F]" aria-hidden />
        <h2
          id="lib-member-reading-title"
          className="font-serif text-lg font-semibold text-[#1A3C2F]"
        >
          회원별 읽는 책
        </h2>
      </div>
      <div className="max-h-[min(28rem,55vh)] space-y-5 overflow-y-auto pr-1">
        {members.map((m) => {
          const label = m.name?.trim() || "이름 없음";
          const readingBooks = books.filter((b) =>
            b.owners.some(
              (o) => o.userId === m.userId && o.readingStatus === "reading",
            ),
          );
          return (
            <div key={m.userId} className="rounded-xl border border-[#1A3C2F]/10 bg-[#F8F9FA]/80 p-3">
              <p className="mb-2 text-sm font-semibold text-[#1A3C2F]">{label}</p>
              {readingBooks.length === 0 ? (
                <p className="text-xs text-[#5c6560]">지금 읽는 책이 없습니다.</p>
              ) : (
                <ul className="flex flex-wrap gap-3">
                  {readingBooks.map((book) => {
                    const src = normalizeCoverUrlForClient(book.coverUrl);
                    return (
                      <li key={book.bookId} className="w-[4.5rem] shrink-0">
                        <Link
                          href={`/libraries/${libraryId}/books/${book.bookId}` as Route}
                          className="group block"
                        >
                          <div
                            className={cn(
                              "relative aspect-[2/3] w-full overflow-hidden rounded-md shadow-md ring-1 ring-[#1A3C2F]/10 transition-transform",
                              "group-hover:-translate-y-0.5",
                            )}
                          >
                            {src ? (
                              <img
                                src={src}
                                alt=""
                                className="size-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-[#e8ece9] p-1 text-center font-serif text-[0.6rem] font-medium leading-tight text-[#1A3C2F]">
                                {book.title}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[0.65rem] font-medium text-[#434843]">
                            {book.title}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
