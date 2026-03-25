import { NextRequest, NextResponse } from "next/server";

import type { UpdateUserBookInput } from "@bookfolio/shared";

import { getRequestUserId } from "@/lib/auth/request-user";
import { deleteUserBook, getUserBook, updateUserBook } from "@/lib/books/repository";

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
    out.format = input.get("format")?.toString() as "paper" | "ebook";
  }
  if (input.has("readingStatus")) {
    out.readingStatus = input.get("readingStatus")?.toString() as UpdateUserBookInput["readingStatus"];
  }
  if (input.has("rating")) {
    const ratingValue = input.get("rating")?.toString() ?? "";
    out.rating = ratingValue ? Number(ratingValue) : null;
  }
  if (input.has("memo")) {
    out.memo = input.get("memo")?.toString() ?? "";
  }
  if (input.has("priceKrw")) {
    const raw = input.get("priceKrw")?.toString() ?? "";
    out.priceKrw = parsePriceKrwField(raw);
  }
  if (input.has("location")) {
    const raw = input.get("location")?.toString().trim() ?? "";
    out.location = raw ? raw : null;
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id } = await params;
    const book = await getUserBook(id, { userId, useAdmin: true });
    if (!book) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(book);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load book";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

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
        const book = await updateUserBook(id, rest as UpdateUserBookInput, { userId, useAdmin: true });
        return NextResponse.json(book);
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
      return NextResponse.redirect(new URL("/dashboard", request.url), 303);
    }

    const payload = parseFormDataToUpdate(formData);
    await updateUserBook(id, payload, { userId, useAdmin: true });
    return NextResponse.redirect(new URL(`/dashboard/books/${id}`, request.url), 303);
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
      new URL(`/dashboard?bookError=${encodeURIComponent(message)}`, request.url),
      303
    );
  }
}
