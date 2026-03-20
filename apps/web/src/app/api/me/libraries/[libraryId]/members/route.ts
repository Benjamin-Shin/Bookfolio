import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { addLibraryMemberByEmail, listLibraryMembers } from "@/lib/libraries/repository";

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한") || message.includes("소유자")) return 403;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const members = await listLibraryMembers(libraryId, userId, { userId, useAdmin: true });
    return NextResponse.json(members);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId } = await context.params;
    const body = (await request.json()) as { email?: string };
    if (!body.email?.trim()) {
      return NextResponse.json({ error: "이메일을 입력해 주세요." }, { status: 400 });
    }
    const row = await addLibraryMemberByEmail(libraryId, body.email, userId, { userId, useAdmin: true });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("권한") || message.includes("소유자")
          ? 403
          : message.includes("찾을 수 없") || message.includes("이미")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
