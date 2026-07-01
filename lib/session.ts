import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookieName, verifySessionToken } from "./session-core";

export { createSessionToken, sessionCookieName, verifySessionToken };

export async function currentSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(sessionCookieName)?.value);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function requireApiSession(request: NextRequest) {
  return verifySessionToken(request.cookies.get(sessionCookieName)?.value);
}
