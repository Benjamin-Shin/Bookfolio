import type { Route } from "next";

import type { AdminCanonicalBookFormValues } from "@/app/dashboard/admin/books/admin-canonical-book-form";
import { expandNormalizedIsbnForDbLookup, normalizeIsbn } from "@/lib/books/lookup";

import type { AladinFeedItem } from "./bestseller-feed";

function spFirst(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

function pickIsbnForForm(item: AladinFeedItem): string {
  const a = item.isbn13?.trim() ?? "";
  if (/^\d{13}$/.test(a)) {
    return a;
  }
  return item.isbn?.trim() ?? "";
}

/**
 * `books.isbn`에 넣을 단일 문자열(알라딘 우선 ISBN-13, 없으면 ISBN-10 등).
 *
 * @history
 * - 2026-03-26: 알라딘 일괄 등록 시 저장용 ISBN
 */
export function canonicalStoredIsbnFromAladinItem(item: AladinFeedItem): string | null {
  const raw = pickIsbnForForm(item);
  const n = normalizeIsbn(raw);
  return n.length > 0 ? n : null;
}

/**
 * 알라딘 `author` 문자열을 저자명 배열로 쪼갭니다.
 *
 * @history
 * - 2026-03-26: 일괄 등록 시 `replace_book_author_links` 입력
 */
export function authorsFromAladinAuthorField(author: string | undefined): string[] {
  const raw = author?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(/[,，]|\s*·\s*|\s*\/\s*/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * 알라딘 한 권과 `books.isbn` 비교용 키(isbn·isbn13 및 10↔13 변형).
 *
 * @history
 * - 2026-03-26: 빠른 추가 목록에서 기등록 도서 제외
 */
export function aladinFeedItemDbIsbnKeys(item: AladinFeedItem): string[] {
  const keys = new Set<string>();
  for (const raw of [item.isbn13, item.isbn]) {
    const n = normalizeIsbn(raw);
    if (!n) continue;
    for (const k of expandNormalizedIsbnForDbLookup(n)) {
      keys.add(k);
    }
  }
  return [...keys];
}

/**
 * 알라딘 한 권 → 관리자 「도서 추가」 폼으로 열 링크(쿼리 프리필).
 *
 * @history
 * - 2026-03-26: `pageCount` 쿼리 반영(알라딘 Open API)
 * - 2026-03-25: 관리자 도서 목록 빠른 추가용
 */
export function adminNewBookPrefillHrefFromAladinItem(item: AladinFeedItem): Route {
  const params = new URLSearchParams();
  if (item.title) {
    params.set("title", item.title);
  }
  if (item.author) {
    params.set("authorsCsv", item.author);
  }
  const isbn = pickIsbnForForm(item);
  if (isbn) {
    params.set("isbn", isbn);
  }
  if (item.publisher) {
    params.set("publisher", item.publisher);
  }
  if (item.pubDate) {
    params.set("publishedDate", item.pubDate);
  }
  if (item.cover) {
    params.set("coverUrl", item.cover);
  }
  if (item.priceSales != null) {
    params.set("priceKrw", String(item.priceSales));
  }
  if (item.pageCount != null) {
    params.set("pageCount", String(item.pageCount));
  }
  params.set("apiSource", "aladin");
  const q = params.toString();
  return (q ? `/dashboard/admin/books/new?${q}` : "/dashboard/admin/books/new") as Route;
}

/**
 * `searchParams`에서 공유 서지 생성 폼 기본값을 만듭니다.
 *
 * @history
 * - 2026-03-26: `pageCount` 쿼리
 * - 2026-03-25: 알라딘 프리필·URL 공유 대비
 */
export function adminBookPrefillFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): Partial<AdminCanonicalBookFormValues> {
  const out: Partial<AdminCanonicalBookFormValues> = {};
  const title = spFirst(sp.title).trim();
  if (title) {
    out.title = title;
  }
  const authorsCsv = spFirst(sp.authorsCsv).trim();
  if (authorsCsv) {
    out.authorsCsv = authorsCsv;
  }
  const translatorsCsv = spFirst(sp.translatorsCsv).trim();
  if (translatorsCsv) {
    out.translatorsCsv = translatorsCsv;
  }
  const isbn = spFirst(sp.isbn).trim();
  if (isbn) {
    out.isbn = isbn;
  }
  const publisher = spFirst(sp.publisher).trim();
  if (publisher) {
    out.publisher = publisher;
  }
  const publishedDate = spFirst(sp.publishedDate).trim();
  if (publishedDate) {
    out.publishedDate = publishedDate;
  }
  const coverUrl = spFirst(sp.coverUrl).trim();
  if (coverUrl) {
    out.coverUrl = coverUrl;
  }
  const description = spFirst(sp.description).trim();
  if (description) {
    out.description = description;
  }
  const priceKrw = spFirst(sp.priceKrw).trim();
  if (priceKrw) {
    out.priceKrw = priceKrw;
  }
  const genreSlugs = spFirst(sp.genreSlugs).trim();
  if (genreSlugs) {
    out.genreSlugs = genreSlugs;
  }
  const literatureRegion = spFirst(sp.literatureRegion).trim();
  if (literatureRegion) {
    out.literatureRegion = literatureRegion;
  }
  const originalLanguage = spFirst(sp.originalLanguage).trim();
  if (originalLanguage) {
    out.originalLanguage = originalLanguage;
  }
  const apiSource = spFirst(sp.apiSource).trim();
  if (apiSource) {
    out.apiSource = apiSource;
  }
  const pageCount = spFirst(sp.pageCount).trim();
  if (pageCount) {
    out.pageCount = pageCount;
  }
  return out;
}
