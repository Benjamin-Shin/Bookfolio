import { NextRequest } from "next/server";

import { auth } from "@/auth";
import { verifyMobileAccessToken } from "@/lib/auth/mobile-jwt";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getRequestUserId(request: NextRequest): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.replace("Bearer ", "");
    const mobileUserId = await verifyMobileAccessToken(token);
    if (mobileUserId) {
      return mobileUserId;
    }

    const admin = createSupabaseAdminClient();
    const {
      data: { user },
      error
    } = await admin.auth.getUser(token);

    if (error || !user) {
      throw new Error("Unauthorized");
    }

    return user.id;
  }

  throw new Error("Unauthorized");
}
