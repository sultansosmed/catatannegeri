import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.toLowerCase().split(":")[0];
  const proto = request.headers.get("x-forwarded-proto") || "";

  // 1. Permanent redirect www.catatannegeri.com -> catatannegeri.com
  if (host === "www.catatannegeri.com") {
    url.host = "catatannegeri.com";
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  // 2. Redirect HTTP -> HTTPS if forwarded proto is http for the production domain
  if (proto === "http" && host.includes("catatannegeri.com")) {
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();

  // 3. Prevent search engines from indexing admin and api endpoints
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  // 4. HSTS Header for production domain
  if (host.includes("catatannegeri.com")) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|brand/|favicon.ico).*)",
  ],
};

