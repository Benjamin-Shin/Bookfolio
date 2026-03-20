import { NextRequest, NextResponse } from "next/server";

import { getRequestUserId } from "@/lib/auth/request-user";
import { removeLibraryMember } from "@/lib/libraries/repository";

function statusForMessage(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message.includes("권한") || message.includes("소유자")) return 403;
  if (message.includes("찾을 수 없") || message.includes("제거할 수 없")) return 400;
  return 500;
}

type RouteContext = { params: Promise<{ libraryId: string; memberUserId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getRequestUserId(request);
    const { libraryId, memberUserId } = await context.params;
    await removeLibraryMember(libraryId, memberUserId, userId, { userId, useAdmin: true });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: statusForMessage(message) });
  }
}
