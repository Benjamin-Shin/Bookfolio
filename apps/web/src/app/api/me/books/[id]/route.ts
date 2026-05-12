import { NextRequest, NextResponse } from "next/server";

import {
  BOOK_FORMATS,
  READING_STATUSES,
  type BookFormat,
  type ReadingStatus,
  type UpdateUserBookInput,
} from "@bookfolio/shared";

import { auth } from "@/auth";
import { getRequestUserId } from "@/lib/auth/request-user";
import { absoluteRedirectUrl } from "@/lib/http/redirect-url";
import { fetchCommunityRatingsByBookIds, mergeCommunityRatingsIntoUserBooks } from "@/lib/books/book-community-ratings";
import {
  deleteUserBook,
  getUserBook,
  updateUserBook,
  updateUserBookShelfOnly,
} from "@/lib/books/repository";

function parsePriceKrwField(raw: string): number | null {
  if (!raw.trim()) {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return Math.round(Math.min(n, 2_000_000_000));
}

/**
 * @history
 * - 2026-05-03: 일반 회원 폼 POST는 `parseFormDataToShelfOnly`·`updateUserBookShelfOnly`; STAFF/ADMIN은 기존 전체 갱신
 * - 2026-05-03: JSON `action:update` — USER는 캐논 키 있으면 403·없으면 shelf만
 * - 2026-03-25: `coverUrl` — 표지 Cloudinary 업로드 후 폼 전송
 */
function parseFormDataToUpdate(input: FormData): UpdateUserBookInput {
  const out: UpdateUserBookInput = {};

  if (input.has("title")) {
    out.title = input.get("title")?.toString() ?? "";
  }
  if (input.has("authorsCsv")) {
    out.authors =
      input
        .get("authorsCsv")
        ?.toString()
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean) ?? [];
  }
  if (input.has("format")) {
    const raw = input.get("format")?.toString() ?? "";
    if ((BOOK_FORMATS as readonly string[]).includes(raw)) {
      out.format = raw as BookFormat;
    }
  }
  if (input.has("readingStatus")) {
    out.readingStatus = input.get("readingStatus")?.toString() as UpdateUserBookInput["readingStatus"];
  }
  if (input.has("rating")) {
    const ratingValue = input.get("rating")?.toString() ?? "";
    out.rating = ratingValue ? Number(ratingValue) : null;
  }
  if (input.has("priceKrw")) {
    const raw = input.get("priceKrw")?.toString() ?? "";
    out.priceKrw = parsePriceKrwField(raw);
  }
  if (input.has("location")) {
    const raw = input.get("location")?.toString().trim() ?? "";
    out.location = raw ? raw : null;
  }
  if (input.has("currentPage")) {
    const raw = input.get("currentPage")?.toString().trim() ?? "";
    if (!raw) {
      out.currentPage = null;
    } else {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) {
        out.currentPage = Math.floor(Math.min(n, 50_000));
      }
    }
  }
  if (input.has("readingTotalPages")) {
    const raw = input.get("readingTotalPages")?.toString().trim() ?? "";
    if (!raw) {
      out.readingTotalPages = null;
    } else {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 1) {
        out.readingTotalPages = Math.floor(Math.min(n, 50_000));
      }
    }
  }
  if (input.has("coverUrl")) {
    const raw = input.get("coverUrl")?.toString().trim() ?? "";
    out.coverUrl = raw ? raw : null;
  }

  const personalOnlyForm = !input.has("title") && !input.has("authorsCsv");
  if (personalOnlyForm) {
    out.isOwned = input.get("isOwned") === "true";
  }

  return out;
}

const CANON_JSON_KEYS = new Set([
  "title",
  "authors",
  "coverUrl",
  "publisher",
  "publishedDate",
  "description",
  "priceKrw",
  "format",
]);

/**
 * 일반 회원 JSON 본문에서 `user_books`만 허용합니다.
 *
 * @history
 * - 2026-05-03: 캐논 필드는 STAFF/ADMIN만 `updateUserBook` 전체 경로로
 */
function pickShelfFieldsFromJson(body: Record<string, unknown>): UpdateUserBookInput {
  const out: UpdateUserBookInput = {};
  if (typeof body.readingStatus === "string") {
    const rs = body.readingStatus.trim();
    if ((READING_STATUSES as readonly string[]).includes(rs)) {
      out.readingStatus = rs as ReadingStatus;
    }
  }
  if ("rating" in body) {
    if (body.rating === null || body.rating === undefined) {
      out.rating = null;
    } else if (typeof body.rating === "number" && Number.isFinite(body.rating)) {
      out.rating = body.rating;
    }
  }
  if (typeof body.isOwned === "boolean") {
    out.isOwned = body.isOwned;
  }
  if ("location" in body) {
    if (body.location === null || body.location === undefined) {
      out.location = null;
    } else if (typeof body.location === "string") {
      const t = body.location.trim();
      out.location = t ? t : null;
    }
  }
  if ("currentPage" in body) {
    if (body.currentPage === null || body.currentPage === undefined) {
      out.currentPage = null;
    } else if (typeof body.currentPage === "number" && Number.isFinite(body.currentPage)) {
      const n = Math.floor(body.currentPage);
      if (n >= 0) out.currentPage = Math.min(n, 50_000);
    }
  }
  if ("readingTotalPages" in body) {
    if (body.readingTotalPages === null || body.readingTotalPages === undefined) {
      out.readingTotalPages = null;
    } else if (
      typeof body.readingTotalPages === "number" &&
      Number.isFinite(body.readingTotalPages)
    ) {
      const n = Math.floor(body.readingTotalPages);
      if (n >= 1) out.readingTotalPages = Math.min(n, 50_000);
    }
  }
  return out;
}

function jsonBodyHasCanonFields(body: Record<string, unknown>): boolean {
  for (const k of Object.keys(body)) {
    if (k === "action") continue;
    if (CANON_JSON_KEYS.has(k)) return true;
  }
  return false;
}

/**
 * 멀티파트에서 `user_books` 전용 필드만 읽습니다(표지·가격·제목 등 제외).
 *
 * @history
 * - 2026-05-03: 웹 상세 인라인 폼용
 */
function parseFormDataToShelfOnly(input: FormData): UpdateUserBookInput {
  const out: UpdateUserBookInput = {};
  if (input.has("readingStatus")) {
    const raw = input.get("readingStatus")?.toString() ?? "";
    if ((READING_STATUSES as readonly string[]).includes(raw)) {
      out.readingStatus = raw as ReadingStatus;
    }
  }
  if (input.has("rating")) {
    const ratingValue = input.get("rating")?.toString() ?? "";
    out.rating = ratingValue ? Number(ratingValue) : null;
  }
  if (input.has("location")) {
    const raw = input.get("location")?.toString().trim() ?? "";
    out.location = raw ? raw : null;
  }
  if (input.has("currentPage")) {
    const raw = input.get("currentPage")?.toString().trim() ?? "";
    if (!raw) {
      out.currentPage = null;
    } else {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) {
        out.currentPage = Math.floor(Math.min(n, 50_000));
      }
    }
  }
  if (input.has("readingTotalPages")) {
    const raw = input.get("readingTotalPages")?.toString().trim() ?? "";
    if (!raw) {
      out.readingTotalPages = null;
    } else {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 1) {
        out.readingTotalPages = Math.floor(Math.min(n, 50_000));
      }
    }
  }
  out.isOwned = input.get("isOwned") === "true";
  return out;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id } = await params;
    const book = await getUserBook(id, { userId, useAdmin: true });
    if (!book) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const ratings = await fetchCommunityRatingsByBookIds([book.bookId]);
    const [enriched] = mergeCommunityRatingsIntoUserBooks([book], ratings);
    return NextResponse.json(enriched);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load book";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

/**
 * 폼 POST(삭제·서가 갱신) 시 리다이렉트 `Location`은 `absoluteRedirectUrl`로 구성합니다.
 *
 * @history
 * - 2026-05-12: `Host: 0.0.0.0` 환경에서 `new URL(..., request.url)` 리다이렉트 실패 방지
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const userId = await getRequestUserId(request);
    const { id } = await context.params;

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      const action = typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

      if (action === "delete") {
        await deleteUserBook(id, { userId, useAdmin: true });
        return new NextResponse(null, { status: 204 });
      }

      if (action === "update") {
        const { action: _a, ...rest } = body;
        const session = await auth();
        const role = session?.user?.role;
        const isStaff = role === "ADMIN" || role === "STAFF";

        if (isStaff) {
          const book = await updateUserBook(id, rest as UpdateUserBookInput, {
            userId,
            useAdmin: true,
          });
          const ratings = await fetchCommunityRatingsByBookIds([book.bookId]);
          const [enriched] = mergeCommunityRatingsIntoUserBooks([book], ratings);
          return NextResponse.json(enriched);
        }

        if (jsonBodyHasCanonFields(rest)) {
          return NextResponse.json(
            { error: "공유 서지 필드는 스태프 이상만 API로 갱신할 수 있습니다." },
            { status: 403 },
          );
        }

        const shelf = pickShelfFieldsFromJson(rest);
        const book = await updateUserBookShelfOnly(id, shelf, {
          userId,
          useAdmin: true,
        });
        const ratings = await fetchCommunityRatingsByBookIds([book.bookId]);
        const [enriched] = mergeCommunityRatingsIntoUserBooks([book], ratings);
        return NextResponse.json(enriched);
      }

      return NextResponse.json(
        { error: "JSON 요청에는 action 이 update 또는 delete 여야 합니다." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const method = formData.get("_method")?.toString()?.trim().toUpperCase();

    if (method === "DELETE") {
      await deleteUserBook(id, { userId, useAdmin: true });
      return NextResponse.redirect(absoluteRedirectUrl(request, "/dashboard"), 303);
    }

    const session = await auth();
    const role = session?.user?.role;
    const isStaff = role === "ADMIN" || role === "STAFF";

    if (isStaff) {
      const payload = parseFormDataToUpdate(formData);
      await updateUserBook(id, payload, { userId, useAdmin: true });
    } else {
      const shelf = parseFormDataToShelfOnly(formData);
      await updateUserBookShelfOnly(id, shelf, { userId, useAdmin: true });
    }
    return NextResponse.redirect(
      absoluteRedirectUrl(request, `/dashboard/books/${id}`),
      303,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return NextResponse.json(
        { error: message },
        { status: message === "Unauthorized" ? 401 : 500 }
      );
    }
    return NextResponse.redirect(
      absoluteRedirectUrl(
        request,
        `/dashboard?bookError=${encodeURIComponent(message)}`,
      ),
      303,
    );
  }
}
