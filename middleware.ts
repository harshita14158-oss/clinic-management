import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifySessionToken } from "@/lib/session-core";

const protectedApiPrefixes = ["/api/save-pdf", "/api/visits", "/api/appointments"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectsClinicPage = pathname.startsWith("/clinic/");
  const protectsApi = protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!protectsClinicPage && !protectsApi) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(request.cookies.get(sessionCookieName)?.value);
  if (session) return NextResponse.next();

  if (protectsApi) {
    return NextResponse.json({ error: "Clinic login required." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/clinic";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/clinic/:path*", "/api/save-pdf/:path*", "/api/visits/:path*", "/api/appointments/:path*"]
};
