import { type NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";

import { edgeAuthConfig } from "@/auth.edge";
import { getAuthSecret } from "@/lib/auth/get-auth-secret";

const { auth } = NextAuth({
  ...edgeAuthConfig,
  secret: getAuthSecret()
});

/** Flutter web(Chrome) 등 다른 origin에서 로컬 API를 부를 때 프리플라이트·본요청 CORS (개발 전용) */
function withApiDevCors(req: NextRequest, res: NextResponse): NextResponse {
  if (process.env.NODE_ENV !== "development") {
    return res;
  }
  const origin = req.headers.get("origin");
  if (!origin) {
    return res;
  }
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export default auth((req) => {
  const isApi = req.nextUrl.pathname.startsWith("/api");

  if (process.env.NODE_ENV === "development" && isApi && req.method === "OPTIONS") {
    return withApiDevCors(req, new NextResponse(null, { status: 204 }));
  }

  if (req.nextUrl.pathname.startsWith("/dashboard") && !req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  if (isApi) {
    return withApiDevCors(req, res);
  }
  return res;
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
};
