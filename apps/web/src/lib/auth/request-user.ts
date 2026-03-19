import { NextRequest } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function getRequestUserId(request: NextRequest): Promise<string> {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.replace("Bearer ", "");
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}
