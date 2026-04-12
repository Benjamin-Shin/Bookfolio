import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import {
  fetchCommunityRatingsByBookIds,
  mergeCommunityRatingsIntoUserBooks
} from "@/lib/books/book-community-ratings";
import {
  createUserBook,
  listUserBooks,
  listUserBooksPaged,
  UserBookAlreadyInShelfError
} from "@/lib/books/repository";
import { linkUserBookToOwnedLibraries } from "@/lib/libraries/repository";

function optionalString(input: FormData, key: string): string | null {
  const raw = input.get(key)?.toString().trim();
  return raw ? raw : null;
}

function optionalPriceKrw(input: FormData, key: string): number | null {
  const raw = input.get(key)?.toString().trim() ?? "";
  if (!raw) {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return Math.round(Math.min(n, 2_000_000_000));
}

function parseFormDataToCreate(input: FormData) {
  const ratingValue = input.get("rating")?.toString() ?? "";

  return {
    title: input.get("title")?.toString() ?? "",
    authors:
      input
        .get("authorsCsv")
        ?.toString()
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean) ?? [],
    format: (input.get("format")?.toString() ?? "paper") as "paper" | "ebook",
    readingStatus: (input.get("readingStatus")?.toString() ?? "unread") as
      | "unread"
      | "reading"
      | "completed"
      | "paused"
      | "dropped",
    rating: ratingValue ? Number(ratingValue) : null,
    isbn: optionalString(input, "isbn"),
    coverUrl: optionalString(input, "coverUrl"),
    publisher: optionalString(input, "publisher"),
    publishedDate: optionalString(input, "publishedDate"),
    description: optionalString(input, "description"),
    priceKrw: optionalPriceKrw(input, "priceKrw"),
    location: optionalString(input, "location")
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const pageRaw = searchParams.get("page");

    if (pageRaw !== null) {
      const page = Math.max(1, parseInt(pageRaw, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "14", 10) || 14));
      const search =
        searchParams.get("search")?.trim() ||
        searchParams.get("q")?.trim() ||
        undefined;
      const { items, total } = await listUserBooksPaged(
        {
          search,
          limit: pageSize,
          offset: (page - 1) * pageSize,
          format: (searchParams.get("format") as "all" | "paper" | "ebook" | null) ?? undefined,
          readingStatus: (searchParams.get("readingStatus") as
            | "all"
            | "unread"
            | "reading"
            | "completed"
            | "paused"
            | "dropped"
            | null) ?? undefined
        },
        { userId, useAdmin: true }
      );
      const ratings = await fetchCommunityRatingsByBookIds(items.map((b) => b.bookId));
      const enriched = mergeCommunityRatingsIntoUserBooks(items, ratings);
      return NextResponse.json({
        items: enriched,
        total,
        page,
        pageSize
      });
    }

    const data = await listUserBooks(
      {
        search: searchParams.get("search") ?? searchParams.get("q") ?? undefined,
        format: (searchParams.get("format") as "all" | "paper" | "ebook" | null) ?? undefined,
        readingStatus: (searchParams.get("readingStatus") as
          | "all"
          | "unread"
          | "reading"
          | "completed"
          | "paused"
          | "dropped"
          | null) ?? undefined
      },
      { userId, useAdmin: true }
    );
    const ratings = await fetchCommunityRatingsByBookIds(data.map((b) => b.bookId));
    return NextResponse.json(mergeCommunityRatingsIntoUserBooks(data, ratings));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load books";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    const userId = await getRequestUserId(request);
    const payload = contentType.includes("application/json")
      ? await request.json()
      : parseFormDataToCreate(await request.formData());

    const created = await createUserBook(payload, { userId, useAdmin: true });
    await linkUserBookToOwnedLibraries(created.id, userId, { userId, useAdmin: true });

    if (contentType.includes("application/json")) {
      const ratings = await fetchCommunityRatingsByBookIds([created.bookId]);
      const [enriched] = mergeCommunityRatingsIntoUserBooks([created], ratings);
      return NextResponse.json(enriched, { status: 201 });
    }

    return NextResponse.redirect(new URL(`/dashboard/books/${created.id}`, request.url), 303);
  } catch (error) {
    if (error instanceof UserBookAlreadyInShelfError) {
      if (contentType.includes("application/json")) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            existingUserBookId: error.existingUserBookId
          },
          { status: 409 }
        );
      }
      return NextResponse.redirect(
        new URL(`/dashboard/books/${error.existingUserBookId}?already_in_shelf=1`, request.url),
        303
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create book";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
