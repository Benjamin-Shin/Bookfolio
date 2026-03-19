import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { deleteUserBook, getUserBook, updateUserBook } from "@/lib/books/repository";

function parseFormDataToUpdate(input: FormData) {
  const ratingValue = input.get("rating")?.toString() ?? "";
  return {
    title: input.get("title")?.toString() ?? undefined,
    authors: input
      .get("authorsCsv")
      ?.toString()
      .split(",")
      .map((author) => author.trim())
      .filter(Boolean),
    format: input.get("format")?.toString() as "paper" | "ebook" | undefined,
    readingStatus: input.get("readingStatus")?.toString() as
      | "unread"
      | "reading"
      | "completed"
      | "paused"
      | "dropped"
      | undefined,
    rating: ratingValue ? Number(ratingValue) : null,
    memo: input.get("memo")?.toString() ?? undefined
  };
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id } = await params;
    const contentType = request.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await request.json()
      : parseFormDataToUpdate(await request.formData());
    const book = await updateUserBook(id, payload, { userId, useAdmin: true });
    return NextResponse.json(book);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update book";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getRequestUserId(request);
    const { id } = await params;
    await deleteUserBook(id, { userId, useAdmin: true });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete book";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const formData = await request.formData();
  const method = formData.get("_method")?.toString()?.toUpperCase();
  const userId = await getRequestUserId(request);
  const id = (await context.params).id;

  if (method === "DELETE") {
    await deleteUserBook(id, { userId, useAdmin: true });
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  await updateUserBook(id, parseFormDataToUpdate(formData), { userId, useAdmin: true });
  return NextResponse.redirect(new URL(`/dashboard/books/${id}`, request.url), 303);
}
