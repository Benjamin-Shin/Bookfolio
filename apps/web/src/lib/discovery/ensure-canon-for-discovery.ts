import { lookupBookByIsbn, normalizeIsbn } from "@/lib/books/lookup";
import {
  findFirstCanonicalBookByIsbnVariants,
  resolveCanonicalBookForSharedLibrary,
  type DbCanonicalBook,
} from "@/lib/books/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * ISBN로 서지가 없으면 네이버·국립 등 Open API 조회 후 `books`에 반영하지 못한 경우의 오류.
 *
 * @history
 * - 2026-05-04: 발견 `/discovery/books/by-isbn/...` 전용
 */
export class DiscoveryIsbnHydrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscoveryIsbnHydrationError";
  }
}

/**
 * `books`에 없으면 ISBN Open API를 호출해 캐논 행을 만들고(`resolveCanonicalBookForSharedLibrary`), 이미 있으면 그대로 반환합니다.
 *
 * @history
 * - 2026-05-04: 발견 허브·알라딘 타일 상세 진입 시 서지 확보
 */
export async function loadOrCreateCanonBookForDiscoveryByIsbn(
  rawIsbn: string,
): Promise<{ book: DbCanonicalBook; existedInCatalog: boolean }> {
  const supabase = createSupabaseAdminClient();
  const normalized = normalizeIsbn(rawIsbn);
  if (!normalized) {
    throw new DiscoveryIsbnHydrationError("ISBN이 필요합니다.");
  }

  const existing = await findFirstCanonicalBookByIsbnVariants(supabase, normalized);
  if (existing) {
    return { book: existing, existedInCatalog: true };
  }

  let looked;
  try {
    looked = await lookupBookByIsbn(normalized);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ISBN 조회에 실패했습니다.";
    throw new DiscoveryIsbnHydrationError(msg);
  }

  const isbnStored = normalizeIsbn(looked.isbn) || normalized;
  const book = await resolveCanonicalBookForSharedLibrary(supabase, {
    isbn: isbnStored,
    title: looked.title.trim() ? looked.title.trim() : "제목 미상",
    authors: looked.authors.length > 0 ? looked.authors : ["저자 미상"],
    publisher: looked.publisher ?? null,
    publishedDate: looked.publishedDate ?? null,
    coverUrl: looked.coverUrl ?? null,
    description: looked.description ?? null,
    priceKrw: looked.priceKrw ?? null,
    format: "paper",
    catalogSource: looked.source || "external",
    genreSlugs:
      looked.genreSlugs != null && looked.genreSlugs.length > 0
        ? looked.genreSlugs
        : null,
    pageCount: looked.pageCount ?? null,
  });

  return { book, existedInCatalog: false };
}
