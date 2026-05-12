"use client";

import Link from "next/link";
import type { Route } from "next";
import { Camera, Loader2, Search, X } from "lucide-react";
import { useCallback, useState } from "react";

import { IsbnBarcodeScannerDialog } from "@/components/search/isbn-barcode-scanner-dialog.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type UserHit = {
  kind: "user_book";
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  isbn: string | null;
};

type CatalogHit = {
  kind: "catalog";
  isbn: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  href: `/discovery/books/by-isbn/${string}`;
};

type AladinHit = {
  kind: "aladin";
  title: string;
  author: string;
  coverUrl: string;
  href: string;
  isbn13: string;
};

type SearchPayload = {
  userBooks: UserHit[];
  catalog: CatalogHit[];
  aladin: AladinHit[];
};

/**
 * 로그인 헤더용 도서 검색 — 돋보기로 펼침, 헤더 바로 아래 줄에 제목·저자·ISBN·검색·바코드.
 *
 * @history
 * - 2026-05-12: 펼침 시 `fixed top-14` 보조 줄로 본문 `h-14` 레이아웃 유지
 * - 2026-05-12: 신규 — `/api/me/header-book-search`·`IsbnBarcodeScannerDialog`
 */
export function HeaderBookSearchPanel() {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchPayload | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const runSearch = useCallback(async () => {
    const params = new URLSearchParams();
    if (title.trim()) {
      params.set("title", title.trim());
    }
    if (author.trim()) {
      params.set("author", author.trim());
    }
    if (isbn.trim()) {
      params.set("isbn", isbn.trim());
    }
    const qs = params.toString();
    if (qs.length === 0) {
      setError("제목·저자·ISBN 중 하나 이상 입력해 주세요.");
      setData(null);
      setResultsOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/header-book-search?${qs}`, { cache: "no-store" });
      const json = (await res.json()) as SearchPayload & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "검색에 실패했습니다.");
      }
      setData({
        userBooks: json.userBooks ?? [],
        catalog: json.catalog ?? [],
        aladin: json.aladin ?? [],
      });
      setResultsOpen(true);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "검색에 실패했습니다.");
      setResultsOpen(true);
    } finally {
      setLoading(false);
    }
  }, [title, author, isbn]);

  const collapse = useCallback(() => {
    setExpanded(false);
    setResultsOpen(false);
    setData(null);
    setError(null);
  }, []);

  return (
    <>
      <div className="relative hidden sm:block">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-[#1A3C2F]"
          aria-expanded={expanded}
          aria-label={expanded ? "검색 닫기" : "도서 검색 열기"}
          onClick={() => {
            if (expanded) {
              collapse();
            } else {
              setExpanded(true);
            }
          }}
        >
          {expanded ? <X className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
        </Button>
      </div>

      {expanded ? (
        <div
          className={cn(
            "fixed top-14 right-0 left-0 z-[60] border-b border-[#1A3C2F]/10 bg-[#F8F9FA]/98 px-3 py-2 shadow-sm backdrop-blur-md sm:px-4",
          )}
          role="search"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <Label htmlFor="hdr-book-title" className="sr-only">
                  제목
                </Label>
                <Input
                  id="hdr-book-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  autoComplete="off"
                  className="h-9 min-w-0 border-[#1A3C2F]/15 bg-white text-sm text-[#1A3C2F] placeholder:text-[#1A3C2F]/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runSearch();
                    }
                  }}
                />
              </div>
              <div className="grid min-w-0 flex-1 gap-0.5">
                <Label htmlFor="hdr-book-author" className="sr-only">
                  저자
                </Label>
                <Input
                  id="hdr-book-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="저자"
                  autoComplete="off"
                  className="h-9 min-w-0 border-[#1A3C2F]/15 bg-white text-sm text-[#1A3C2F] placeholder:text-[#1A3C2F]/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runSearch();
                    }
                  }}
                />
              </div>
              <div className="grid min-w-0 flex-1 gap-0.5">
                <Label htmlFor="hdr-book-isbn" className="sr-only">
                  ISBN
                </Label>
                <Input
                  id="hdr-book-isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="ISBN"
                  inputMode="numeric"
                  autoComplete="off"
                  className="h-9 min-w-0 border-[#1A3C2F]/15 bg-white text-sm text-[#1A3C2F] placeholder:text-[#1A3C2F]/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runSearch();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-9 border-[#1A3C2F]/20 bg-[#1A3C2F] px-4 text-sm text-white hover:bg-[#1A3C2F]/90"
                disabled={loading}
                onClick={() => void runSearch()}
              >
                {loading ? <Loader2 className="me-2 size-4 animate-spin" aria-hidden /> : null}
                검색
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-9 shrink-0 border-[#1A3C2F]/20 text-[#1A3C2F]"
                aria-label="ISBN 바코드 카메라"
                onClick={() => setScanOpen(true)}
              >
                <Camera className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          {resultsOpen && (data || error) ? (
            <div className="mx-auto mt-2 w-full max-w-6xl">
              <div
                className="max-h-[min(65vh,400px)] overflow-y-auto rounded-xl border border-[#1A3C2F]/12 bg-white py-2 shadow-md"
                role="listbox"
                aria-label="검색 결과"
              >
                {error ? (
                  <p className="px-3 py-2 text-sm text-red-700">{error}</p>
                ) : data ? (
                  <>
                    {data.userBooks.length === 0 &&
                    data.catalog.length === 0 &&
                    data.aladin.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-[#5c6560]">결과가 없습니다.</p>
                    ) : null}
                    {data.userBooks.length > 0 ? (
                      <div className="border-b border-[#1A3C2F]/8 px-2 py-1">
                        <p className="px-2 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#1A3C2F]">
                          내 서가
                        </p>
                        <ul>
                          {data.userBooks.map((b) => (
                            <li key={b.id}>
                              <Link
                                href={`/dashboard/books/${b.id}` as Route}
                                className="block rounded-lg px-2 py-2 text-sm hover:bg-[#F8F9FA]"
                                onClick={collapse}
                              >
                                <span className="line-clamp-2 font-medium text-[#051b0e]">{b.title}</span>
                                <span className="line-clamp-1 text-xs text-[#5c6560]">{b.authors}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {data.catalog.length > 0 ? (
                      <div className="border-b border-[#1A3C2F]/8 px-2 py-1">
                        <p className="px-2 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#675d53]">
                          북폴리오 서지
                        </p>
                        <ul>
                          {data.catalog.map((b) => (
                            <li key={b.isbn}>
                              <Link
                                href={b.href}
                                className="block rounded-lg px-2 py-2 text-sm hover:bg-[#F8F9FA]"
                                onClick={collapse}
                              >
                                <span className="line-clamp-2 font-medium text-[#051b0e]">{b.title}</span>
                                <span className="line-clamp-1 text-xs text-[#5c6560]">{b.authors}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {data.aladin.length > 0 ? (
                      <div className="px-2 py-1">
                        <p className="px-2 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#7a847c]">
                          알라딘
                        </p>
                        <ul>
                          {data.aladin.map((b) => {
                            const ext = b.href.startsWith("http");
                            return (
                              <li key={`${b.isbn13}-${b.href}`}>
                                {ext ? (
                                  <a
                                    href={b.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-lg px-2 py-2 text-sm hover:bg-[#F8F9FA]"
                                    onClick={collapse}
                                  >
                                    <span className="line-clamp-2 font-medium text-[#051b0e]">{b.title}</span>
                                    <span className="line-clamp-1 text-xs text-[#5c6560]">{b.author}</span>
                                  </a>
                                ) : (
                                  <Link
                                    href={b.href as Route}
                                    className="block rounded-lg px-2 py-2 text-sm hover:bg-[#F8F9FA]"
                                    onClick={collapse}
                                  >
                                    <span className="line-clamp-2 font-medium text-[#051b0e]">{b.title}</span>
                                    <span className="line-clamp-1 text-xs text-[#5c6560]">{b.author}</span>
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <IsbnBarcodeScannerDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onDecoded={(digits) => {
          setIsbn(digits);
          setExpanded(true);
        }}
      />
    </>
  );
}
