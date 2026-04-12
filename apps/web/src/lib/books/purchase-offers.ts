import type { SupabaseClient } from "@supabase/supabase-js";

import { aladinItemLookupByIsbn } from "@/lib/books/aladin-item-lookup";
import { buildKyoboBookSearchUrl } from "@/lib/books/kyobo-search-url";
import { fetchNaverBookOfferHint, normalizeIsbn } from "@/lib/books/lookup";
import { env } from "@/lib/env";

/**
 * 비소장 상세·구매 링크 API 응답 DTO.
 *
 * @history
 * - 2026-04-08: 알라딘·네이버·교보 행 + 캐시 메타
 */
export type BookPurchaseOffersPayload = {
  bookId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  aladin: { url: string; priceKrw: number | null };
  naver: { url: string | null; priceKrw: number | null };
  kyobo: { url: string };
  cached: boolean;
  fetchedAt: string;
  expiresAt: string;
};

type CanonBookRow = {
  id: string;
  isbn: string | null;
  title: string;
  authors: string[] | null;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function buildAladinFallbackSearchUrl(keyword: string): string {
  const params = new URLSearchParams();
  params.set("SearchTarget", "Book");
  params.set("KeyWord", keyword.trim());
  return `https://www.aladin.co.kr/search/wsearchresult.aspx?${params.toString()}`;
}

function searchKeywordForStores(book: CanonBookRow): string {
  const isbn = book.isbn?.trim();
  if (isbn) {
    const n = normalizeIsbn(isbn);
    if (n.length >= 10) {
      return n;
    }
  }
  const a0 = book.authors?.[0]?.trim();
  return a0 != null && a0.length > 0 ? `${book.title} ${a0}` : book.title;
}

type CacheRow = {
  book_id: string;
  isbn: string | null;
  title_hint: string | null;
  aladin_url: string | null;
  aladin_price_krw: number | null;
  naver_url: string | null;
  naver_lowest_price_krw: number | null;
  kyobo_search_url: string;
  fetched_at: string;
  expires_at: string;
};

async function loadValidCache(
  admin: SupabaseClient,
  bookId: string
): Promise<CacheRow | null> {
  const { data, error } = await admin
    .from("book_purchase_offer_cache")
    .select("*")
    .eq("book_id", bookId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  const row = data as CacheRow;
  const exp = Date.parse(row.expires_at);
  if (!Number.isFinite(exp) || exp <= Date.now()) {
    return null;
  }
  return row;
}

async function loadCanonBook(admin: SupabaseClient, bookId: string): Promise<CanonBookRow | null> {
  const { data, error } = await admin
    .from("books")
    .select("id,isbn,title,authors")
    .eq("id", bookId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data as CanonBookRow;
}

async function persistCache(
  admin: SupabaseClient,
  row: {
    bookId: string;
    isbn: string | null;
    titleHint: string;
    aladinUrl: string;
    aladinPrice: number | null;
    naverUrl: string | null;
    naverPrice: number | null;
    kyoboUrl: string;
    snapshot: Record<string, unknown>;
  }
): Promise<{ fetchedAt: string; expiresAt: string }> {
  const now = new Date();
  const expires = new Date(now.getTime() + CACHE_TTL_MS);
  const { error } = await admin.from("book_purchase_offer_cache").upsert(
    {
      book_id: row.bookId,
      isbn: row.isbn,
      title_hint: row.titleHint,
      aladin_url: row.aladinUrl,
      aladin_price_krw: row.aladinPrice,
      naver_url: row.naverUrl,
      naver_lowest_price_krw: row.naverPrice,
      kyobo_search_url: row.kyoboUrl,
      raw_snapshot: row.snapshot,
      fetched_at: now.toISOString(),
      expires_at: expires.toISOString()
    },
    { onConflict: "book_id" }
  );
  if (error) {
    throw new Error(error.message);
  }
  return { fetchedAt: now.toISOString(), expiresAt: expires.toISOString() };
}

/**
 * 캐논 `books.id`에 대해 구매 힌트를 반환합니다(유효 캐시 우선, 만료 시 재조회).
 *
 * @history
 * - 2026-04-08: 초기 구현(알라딘 TTB·네이버·교보)
 */
export async function getOrRefreshBookPurchaseOffers(
  admin: SupabaseClient,
  bookId: string
): Promise<BookPurchaseOffersPayload | null> {
  const book = await loadCanonBook(admin, bookId);
  if (!book) {
    return null;
  }

  const cached = await loadValidCache(admin, bookId);
  if (cached) {
    return {
      bookId: book.id,
      isbn: book.isbn,
      title: book.title,
      authors: book.authors ?? [],
      aladin: {
        url: cached.aladin_url ?? buildAladinFallbackSearchUrl(searchKeywordForStores(book)),
        priceKrw: cached.aladin_price_krw
      },
      naver: {
        url: cached.naver_url,
        priceKrw: cached.naver_lowest_price_krw
      },
      kyobo: { url: cached.kyobo_search_url },
      cached: true,
      fetchedAt: cached.fetched_at,
      expiresAt: cached.expires_at
    };
  }

  const keyword = searchKeywordForStores(book);
  const kyoboUrl = buildKyoboBookSearchUrl(keyword);
  const aladinFallback = buildAladinFallbackSearchUrl(keyword);

  let aladinUrl = aladinFallback;
  let aladinPrice: number | null = null;
  const ttb = env.aladinTtbKey;
  const isbnNorm = book.isbn ? normalizeIsbn(book.isbn) : "";
  if (ttb && isbnNorm.length >= 10) {
    const hit = await aladinItemLookupByIsbn(isbnNorm, ttb);
    if (hit?.productUrl) {
      aladinUrl = hit.productUrl;
    }
    aladinPrice = hit?.priceSalesKrw ?? null;
  }

  let naverUrl: string | null = null;
  let naverPrice: number | null = null;
  const naverId = process.env.NAVER_API_CLIENT_ID?.trim();
  const naverSecret = process.env.NAVER_API_CLIENT_SECRET?.trim();
  if (naverId && naverSecret) {
    const q = isbnNorm.length >= 10 ? isbnNorm : keyword;
    const hint = await fetchNaverBookOfferHint(q, naverId, naverSecret);
    if (hint) {
      naverUrl = hint.link;
      naverPrice = hint.priceKrw;
    }
  }

  const { fetchedAt, expiresAt } = await persistCache(admin, {
    bookId: book.id,
    isbn: book.isbn,
    titleHint: book.title,
    aladinUrl,
    aladinPrice,
    naverUrl,
    naverPrice,
    kyoboUrl,
    snapshot: {
      source: "bookfolio_purchase_offers_v1",
      aladinUsedLookup: Boolean(ttb && isbnNorm.length >= 10)
    }
  });

  return {
    bookId: book.id,
    isbn: book.isbn,
    title: book.title,
    authors: book.authors ?? [],
    aladin: { url: aladinUrl, priceKrw: aladinPrice },
    naver: { url: naverUrl, priceKrw: naverPrice },
    kyobo: { url: kyoboUrl },
    cached: false,
    fetchedAt,
    expiresAt
  };
}
