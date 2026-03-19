import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { createUserBook, listUserBooks } from "@/lib/books/repository";

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
    memo: input.get("memo")?.toString() ?? null
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const { searchParams } = new URL(request.url);
    const data = await listUserBooks(
      {
        search: searchParams.get("search") ?? undefined,
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
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load books";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    const contentType = request.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await request.json()
      : parseFormDataToCreate(await request.formData());

    const created = await createUserBook(payload, { userId, useAdmin: true });

    if (contentType.includes("application/json")) {
      return NextResponse.json(created, { status: 201 });
    }

    return NextResponse.redirect(new URL(`/dashboard/books/${created.id}`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create book";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
