"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/require-admin";
import type { AladinFeedItem } from "@/lib/aladin/bestseller-feed";
import {
  aladinFeedItemDbIsbnKeys,
  authorsFromAladinAuthorField,
  canonicalStoredIsbnFromAladinItem,
} from "@/lib/aladin/admin-book-prefill";
import { fetchAladinItemList } from "@/lib/aladin/item-list";
import { mergeAladinFeedItemsDeduped } from "@/lib/aladin/merge-feed-items";
import { fetchExistingBooksIsbnSet } from "@/lib/books/existing-isbn-lookup";
import { normalizeIsbn } from "@/lib/books/lookup";
import { replaceBookAuthorLinks } from "@/lib/books/replace-book-author-links";
import { env } from "@/lib/env";
import { linkUserBookToOwnedLibraries } from "@/lib/libraries/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

import {
  initialAladinBulkImportState,
  type AladinBulkImportState,
} from "./admin-aladin-bulk-import-state";

export type AdminBookActionState = { error: string | null };

function parseAuthorsCsv(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseGenreSlugs(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOptionalInt(raw: string | null): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** `books.page_count`: 1–50000 또는 비움( null ). */
function parseOptionalPageCount(raw: string | null): number | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n >= 1 && n <= 50_000 ? n : null;
}

/**
 * 관리자 도서 폼에서 공유 서지 필드를 파싱합니다.
 *
 * @history
 * - 2026-03-26: `pageCount` → `page_count`
 * - 2026-03-24: `translatorsCsv`, `apiSource` 추가
 */
function readCanonicalFields(formData: FormData) {
  const title = formData.get("title")?.toString().trim() ?? "";
  const authors = parseAuthorsCsv(formData.get("authorsCsv")?.toString() ?? "");
  const translators = parseAuthorsCsv(
    formData.get("translatorsCsv")?.toString() ?? "",
  );
  const isbnRaw = formData.get("isbn")?.toString() ?? "";
  const normalizedIsbn = normalizeIsbn(isbnRaw);
  const isbn = normalizedIsbn.length > 0 ? normalizedIsbn : null;

  const publisher = formData.get("publisher")?.toString().trim() || null;
  const publishedDate =
    formData.get("publishedDate")?.toString().trim() || null;
  const coverUrl = formData.get("coverUrl")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const literatureRegion =
    formData.get("literatureRegion")?.toString().trim() || null;
  const originalLanguage =
    formData.get("originalLanguage")?.toString().trim() || null;
  const apiSourceRaw = formData.get("apiSource")?.toString().trim() ?? "";
  const apiSource = apiSourceRaw.length > 0 ? apiSourceRaw : null;
  const priceKrw = parseOptionalInt(
    formData.get("priceKrw")?.toString() ?? null,
  );
  const pageCount = parseOptionalPageCount(
    formData.get("pageCount")?.toString() ?? null,
  );
  const genreSlugs = parseGenreSlugs(
    formData.get("genreSlugs")?.toString() ?? "",
  );
  const shelfLocationRaw = formData.get("location")?.toString() ?? "";
  const shelfLocation = shelfLocationRaw.trim()
    ? shelfLocationRaw.trim()
    : null;

  return {
    title,
    authors,
    translators,
    isbn,
    publisher,
    publishedDate,
    coverUrl,
    description,
    literatureRegion,
    originalLanguage,
    apiSource,
    priceKrw,
    pageCount,
    genreSlugs,
    shelfLocation,
  };
}

/**
 * @history
 * - 2026-03-26: 관리자 서가 자동 추가 시 `user_books.format` 제거 — DB `0021`은 `books.format`만 사용
 * - 2026-03-26: `page_count` insert
 * - 2026-03-24: `translators`, `api_source` insert 반영
 * - 2026-03-24: 저자는 `replace_book_author_links` 로 `book_authors`·`books.authors` 동기화
 */
export async function createAdminCanonicalBook(
  _prev: AdminBookActionState | null,
  formData: FormData,
): Promise<AdminBookActionState> {
  const session = await requireAdmin();

  const f = readCanonicalFields(formData);
  if (!f.title) {
    return { error: "제목을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .insert({
      title: f.title,
      translators: f.translators,
      isbn: f.isbn,
      publisher: f.publisher,
      published_date: f.publishedDate,
      cover_url: f.coverUrl,
      description: f.description,
      price_krw: f.priceKrw,
      page_count: f.pageCount,
      genre_slugs: f.genreSlugs.length > 0 ? f.genreSlugs : [],
      literature_region: f.literatureRegion,
      original_language: f.originalLanguage,
      api_source: f.apiSource,
      source: "admin",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "같은 ISBN의 도서가 이미 있습니다." };
    }
    return { error: error.message };
  }

  const bookId = data.id as string;

  try {
    await replaceBookAuthorLinks(supabase, bookId, f.authors);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "저자 정보를 저장하지 못했습니다.";
    return { error: message };
  }

  if (f.shelfLocation) {
    const adminId = session.user.id;
    const { data: existingUb, error: exErr } = await supabase
      .from("user_books")
      .select("id")
      .eq("user_id", adminId)
      .eq("book_id", bookId)
      .maybeSingle();

    if (exErr) {
      return { error: exErr.message };
    }

    if (existingUb?.id) {
      const { error: upLocErr } = await supabase
        .from("user_books")
        .update({ location: f.shelfLocation })
        .eq("id", existingUb.id as string)
        .eq("user_id", adminId);
      if (upLocErr) {
        return { error: upLocErr.message };
      }
    } else {
      const { data: insertedUb, error: ubErr } = await supabase
        .from("user_books")
        .insert({
          user_id: adminId,
          book_id: bookId,
          reading_status: "unread",
          is_owned: true,
          location: f.shelfLocation,
        })
        .select("id")
        .single();

      if (ubErr) {
        return { error: ubErr.message };
      }
      const newUbId = insertedUb?.id as string;
      await linkUserBookToOwnedLibraries(newUbId, adminId, {
        userId: adminId,
        useAdmin: true,
      });
    }
  }

  revalidatePath("/dashboard/admin/books");
  revalidatePath("/dashboard/books");
  redirect(`/dashboard/admin/books/${bookId}/edit`);
}

/**
 * @history
 * - 2026-03-26: `page_count` update
 * - 2026-03-24: `translators`, `api_source` update 반영
 * - 2026-03-24: 저자는 `replace_book_author_links` 로 동기화
 */
export async function updateAdminCanonicalBook(
  _prev: AdminBookActionState | null,
  formData: FormData,
): Promise<AdminBookActionState> {
  await requireAdmin();

  const id = formData.get("bookId")?.toString().trim();
  if (!id) {
    return { error: "도서 ID가 없습니다." };
  }

  const f = readCanonicalFields(formData);
  if (!f.title) {
    return { error: "제목을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("books")
    .update({
      title: f.title,
      translators: f.translators,
      isbn: f.isbn,
      publisher: f.publisher,
      published_date: f.publishedDate,
      cover_url: f.coverUrl,
      description: f.description,
      price_krw: f.priceKrw,
      page_count: f.pageCount,
      genre_slugs: f.genreSlugs.length > 0 ? f.genreSlugs : [],
      literature_region: f.literatureRegion,
      original_language: f.originalLanguage,
      api_source: f.apiSource,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "같은 ISBN의 도서가 이미 있습니다." };
    }
    return { error: error.message };
  }

  try {
    await replaceBookAuthorLinks(supabase, id, f.authors);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "저자 정보를 저장하지 못했습니다.";
    return { error: message };
  }

  revalidatePath("/dashboard/admin/books");
  revalidatePath(`/dashboard/admin/books/${id}/edit`);
  return { error: null };
}

export async function deleteAdminCanonicalBook(
  _prev: AdminBookActionState | null,
  formData: FormData,
): Promise<AdminBookActionState> {
  await requireAdmin();

  const bookId = formData.get("bookId")?.toString().trim();
  if (!bookId) {
    return { error: "도서 ID가 없습니다." };
  }

  const supabase = createSupabaseAdminClient();

  const { count: ownedCount, error: ownedErr } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("book_id", bookId)
    .eq("is_owned", true);

  if (ownedErr) {
    return { error: ownedErr.message };
  }
  if (ownedCount && ownedCount > 0) {
    return { error: "사용자 소장 서가에 포함된 도서는 삭제할 수 없습니다." };
  }

  const { count: anyCount, error: anyErr } = await supabase
    .from("user_books")
    .select("*", { count: "exact", head: true })
    .eq("book_id", bookId);

  if (anyErr) {
    return { error: anyErr.message };
  }
  if (anyCount && anyCount > 0) {
    return {
      error: "사용자 서가(읽는 중 등)에 연결된 도서는 삭제할 수 없습니다.",
    };
  }

  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin/books");
  redirect("/dashboard/admin/books");
}

/**
 * 알라딘 베스트셀러·초이스(신간) 목록을 받아 `books`에 없는 ISBN만 일괄 등록합니다.
 *
 * @history
 * - 2026-04-22: `price_krw`를 `priceStandard`(정가) 우선으로 반영
 * - 2026-04-22: `ALADIN_API_BASE_URL` + QueryType 조합 방식으로 통합
 * - 2026-03-26: 일괄 등록 시 `page_count`(알라딘 `pageCount`) 반영
 * - 2026-03-26: 베스트셀러 + 초이스 신간 병합 처리
 */
export async function bulkImportAladinCatalogNotInBooks(
  _prev: AladinBulkImportState | null,
  _formData: FormData,
): Promise<AladinBulkImportState> {
  await requireAdmin();

  const apiBaseUrl = env.aladinApiBaseUrl;

  if (!apiBaseUrl) {
    return {
      ...initialAladinBulkImportState,
      error: "ALADIN_API_BASE_URL을 설정해 주세요.",
    };
  }

  const feedErrors: string[] = [];
  let bestsellerItems: AladinFeedItem[] = [];
  let itemNewItems: AladinFeedItem[] = [];

  try {
    const feed = await fetchAladinItemList(apiBaseUrl, {
      queryType: "Bestseller",
      categoryId: 0,
    });
    bestsellerItems = feed.items;
  } catch (e) {
    feedErrors.push(
      `오늘 베스트셀러 목록: ${e instanceof Error ? e.message : "불러오기 실패"}`,
    );
  }

  try {
    const feed = await fetchAladinItemList(apiBaseUrl, {
      queryType: "ItemNewSpecial",
      categoryId: 0,
    });
    itemNewItems = feed.items;
  } catch (e) {
    feedErrors.push(
      `초이스·신간 목록: ${e instanceof Error ? e.message : "불러오기 실패"}`,
    );
  }

  const merged = mergeAladinFeedItemsDeduped(bestsellerItems, itemNewItems);

  if (merged.length === 0) {
    return {
      ...initialAladinBulkImportState,
      error:
        feedErrors.length > 0
          ? `알라딘 목록을 가져오지 못했습니다. ${feedErrors.join(" ")}`
          : "가져온 목록에 도서가 없습니다.",
      feedErrors,
    };
  }

  const supabase = createSupabaseAdminClient();
  const allLookupKeys = merged.flatMap(aladinFeedItemDbIsbnKeys);
  let existing: Set<string>;
  try {
    existing = await fetchExistingBooksIsbnSet(supabase, allLookupKeys);
  } catch (e) {
    return {
      ...initialAladinBulkImportState,
      error:
        e instanceof Error ? e.message : "기존 서지 ISBN 조회에 실패했습니다.",
      feedErrors,
    };
  }

  let skippedExisting = 0;
  let skippedNoIsbn = 0;
  let skippedInvalid = 0;
  let inserted = 0;

  for (const item of merged) {
    const keys = aladinFeedItemDbIsbnKeys(item);
    if (keys.length === 0) {
      skippedNoIsbn += 1;
      continue;
    }
    if (keys.some((k) => existing.has(k))) {
      skippedExisting += 1;
      continue;
    }

    const isbn = canonicalStoredIsbnFromAladinItem(item);
    if (!isbn) {
      skippedNoIsbn += 1;
      continue;
    }

    const title = item.title?.trim() ?? "";
    if (!title) {
      skippedInvalid += 1;
      continue;
    }

    const authors = authorsFromAladinAuthorField(item.author);
    const coverUrl = item.cover?.trim() || null;
    const publisher = item.publisher?.trim() || null;
    const publishedDate = item.pubDate?.trim() || null;
    const standardPriceKrw =
      item.priceStandard != null &&
      Number.isFinite(item.priceStandard) &&
      item.priceStandard >= 0
        ? Math.floor(item.priceStandard)
        : null;
    const salePriceKrw =
      item.priceSales != null &&
      Number.isFinite(item.priceSales) &&
      item.priceSales >= 0
        ? Math.floor(item.priceSales)
        : null;
    const priceKrw = standardPriceKrw ?? salePriceKrw;

    const pageCountRaw = item.pageCount;
    const pageCount =
      pageCountRaw != null && Number.isFinite(pageCountRaw) && pageCountRaw >= 1
        ? Math.min(Math.floor(pageCountRaw), 50_000)
        : null;

    const { data: row, error: insErr } = await supabase
      .from("books")
      .insert({
        title,
        translators: [],
        isbn,
        publisher,
        published_date: publishedDate,
        cover_url: coverUrl,
        description: null,
        price_krw: priceKrw,
        page_count: pageCount,
        genre_slugs: [],
        literature_region: null,
        original_language: null,
        api_source: "aladin",
        source: "aladin",
      })
      .select("id")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        skippedExisting += 1;
        for (const k of keys) existing.add(k);
        continue;
      }
      return {
        ...initialAladinBulkImportState,
        error: insErr.message,
        inserted,
        skippedExisting,
        skippedNoIsbn,
        skippedInvalid,
        feedErrors,
      };
    }

    const bookId = row?.id as string | undefined;
    if (!bookId) {
      return {
        ...initialAladinBulkImportState,
        error: "도서 ID를 받지 못했습니다.",
        inserted,
        skippedExisting,
        skippedNoIsbn,
        skippedInvalid,
        feedErrors,
      };
    }

    try {
      await replaceBookAuthorLinks(supabase, bookId, authors);
    } catch (e) {
      return {
        ...initialAladinBulkImportState,
        error:
          e instanceof Error ? e.message : "저자 정보를 저장하지 못했습니다.",
        inserted,
        skippedExisting,
        skippedNoIsbn,
        skippedInvalid,
        feedErrors,
      };
    }

    inserted += 1;
    for (const k of keys) existing.add(k);
  }

  revalidatePath("/dashboard/admin/books");
  revalidatePath("/dashboard/books");

  const parts: string[] = [];
  if (inserted > 0) {
    parts.push(`${inserted}권을 새로 등록했습니다.`);
  } else {
    parts.push("신규로 넣을 도서가 없었습니다.");
  }
  if (skippedExisting > 0)
    parts.push(`이미 등록된 ISBN ${skippedExisting}건 생략`);
  if (skippedNoIsbn > 0) parts.push(`ISBN 없음 ${skippedNoIsbn}건 생략`);
  if (skippedInvalid > 0) parts.push(`제목 없음 ${skippedInvalid}건 생략`);
  if (feedErrors.length > 0) parts.push(`참고: ${feedErrors.join(" · ")}`);

  return {
    error: null,
    message: parts.join(" "),
    inserted,
    skippedExisting,
    skippedNoIsbn,
    skippedInvalid,
    feedErrors,
  };
}
