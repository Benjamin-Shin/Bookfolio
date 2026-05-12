import { NextRequest, NextResponse } from "next/server";

import { fetchAladinItemSearchKeyword } from "@/lib/aladin/item-search";
import { resolveAladinItemHref } from "@/lib/aladin/resolve-item-href";
import { discoveryDetailHrefFromAladinItem } from "@/lib/discovery/catalog-detail-href";
import { getRequestUserId } from "@/lib/auth/request-user";
import { expandNormalizedIsbnForDbLookup, normalizeIsbn } from "@/lib/books/lookup";
import {
  listUserBooksPaged,
  searchCanonicalBooksByTitle,
} from "@/lib/books/repository";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function mergeSearchQuery(
  title: string,
  author: string,
  isbnRaw: string,
): string {
  const t = title.trim();
  const a = author.trim();
  const i = normalizeIsbn(isbnRaw).replace(/x/gi, "X");
  const parts: string[] = [];
  if (t.length > 0) {
    parts.push(t);
  }
  if (a.length > 0) {
    parts.push(a);
  }
  if (i.length > 0) {
    parts.push(i);
  }
  return parts.join(" ").trim();
}

function addIsbnVariantsToSet(raw: string | null | undefined, into: Set<string>): void {
  const n = normalizeIsbn(raw ?? "").replace(/x/gi, "X");
  if (n.length < 10) {
    return;
  }
  for (const v of expandNormalizedIsbnForDbLookup(n)) {
    into.add(v);
  }
}

function collectIsbnKeys(...groups: { isbn: string | null }[][]): Set<string> {
  const s = new Set<string>();
  for (const g of groups) {
    for (const row of g) {
      addIsbnVariantsToSet(row.isbn, s);
    }
  }
  return s;
}

export type HeaderBookSearchUserHit = {
  kind: "user_book";
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  isbn: string | null;
};

export type HeaderBookSearchCatalogHit = {
  kind: "catalog";
  isbn: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  href: `/discovery/books/by-isbn/${string}`;
};

export type HeaderBookSearchAladinHit = {
  kind: "aladin";
  title: string;
  author: string;
  coverUrl: string;
  href: string;
  isbn13: string;
};

/**
 * 헤더 통합 도서 검색 — `user_books` → `books` → 알라딘. `title`·`author`·`isbn`을 하나의 검색어로 합칩니다.
 *
 * @history
 * - 2026-05-12: 신규 — `GET ?title=&author=&isbn=` JSON (`userBooks`, `catalog`, `aladin`)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const sp = new URL(request.url).searchParams;
    const q = mergeSearchQuery(
      sp.get("title") ?? "",
      sp.get("author") ?? "",
      sp.get("isbn") ?? "",
    );
    if (q.length < 2) {
      return NextResponse.json({
        userBooks: [] as HeaderBookSearchUserHit[],
        catalog: [] as HeaderBookSearchCatalogHit[],
        aladin: [] as HeaderBookSearchAladinHit[],
      });
    }

    const ctx = { userId, useAdmin: true } as const;
    const [{ items: userItems }, supabase] = await Promise.all([
      listUserBooksPaged(
        {
          search: q,
          limit: 12,
          offset: 0,
        },
        ctx,
      ),
      Promise.resolve(createSupabaseAdminClient()),
    ]);

    const userBooks: HeaderBookSearchUserHit[] = userItems.map((b) => ({
      kind: "user_book",
      id: b.id,
      title: b.title,
      authors: b.authors.join(", "),
      coverUrl: b.coverUrl,
      isbn: b.isbn,
    }));

    const userIsbns = collectIsbnKeys(userBooks);
    const catalogRaw = await searchCanonicalBooksByTitle(supabase, q, 15);
    const catalog: HeaderBookSearchCatalogHit[] = [];
    for (const row of catalogRaw) {
      const digits = normalizeIsbn(row.isbn);
      if (digits.length < 10) {
        continue;
      }
      let inUserShelf = false;
      for (const v of expandNormalizedIsbnForDbLookup(digits)) {
        if (userIsbns.has(v)) {
          inUserShelf = true;
          break;
        }
      }
      if (inUserShelf) {
        continue;
      }
      const path =
        `/discovery/books/by-isbn/${encodeURIComponent(digits)}` as `/discovery/books/by-isbn/${string}`;
      catalog.push({
        kind: "catalog",
        isbn: row.isbn,
        title: row.title,
        authors: row.authors.join(", "),
        coverUrl: row.coverUrl,
        href: path,
      });
    }

    const catalogIsbns = collectIsbnKeys(catalog);
    const skipForAladin = new Set([...userIsbns, ...catalogIsbns]);

    const ttb = env.aladinTtbKey;
    const aladin: HeaderBookSearchAladinHit[] = [];
    if (ttb) {
      const feedItems = await fetchAladinItemSearchKeyword(ttb, q, 10);
      for (const item of feedItems) {
        const rawIsbn = item.isbn13 || item.isbn;
        let skip = false;
        for (const v of expandNormalizedIsbnForDbLookup(normalizeIsbn(rawIsbn))) {
          if (skipForAladin.has(v)) {
            skip = true;
            break;
          }
        }
        if (skip) {
          continue;
        }
        const inApp = discoveryDetailHrefFromAladinItem(item);
        const ext = resolveAladinItemHref(item);
        const href = inApp ?? ext;
        if (!href) {
          continue;
        }
        aladin.push({
          kind: "aladin",
          title: item.title,
          author: item.author,
          coverUrl: item.cover,
          href,
          isbn13: item.isbn13 || item.isbn,
        });
      }
    }

    return NextResponse.json({ userBooks, catalog, aladin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 },
    );
  }
}
