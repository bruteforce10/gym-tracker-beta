import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const CALLBACK_URL_COOKIE_NAMES = [
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
] as const;

function isValidCallbackUrl(value: string, baseUrl: string) {
  try {
    const url = new URL(value, value.startsWith("/") ? baseUrl : undefined);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");
  const isUploadthingApi = req.nextUrl.pathname.startsWith("/api/uploadthing");
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const invalidCallbackCookieNames = CALLBACK_URL_COOKIE_NAMES.filter((name) => {
    const value = req.cookies.get(name)?.value;
    return value && !isValidCallbackUrl(value, req.nextUrl.origin);
  });

  const applyCookieCleanup = (response: NextResponse) => {
    for (const cookieName of invalidCallbackCookieNames) {
      response.cookies.delete(cookieName);
    }
    return response;
  };

  // Allow auth API routes
  if (isAuthApi) return applyCookieCleanup(NextResponse.next());
  if (isUploadthingApi) return applyCookieCleanup(NextResponse.next());

  // Redirect logged-in users away from login page
  if (isLoginPage && isLoggedIn) {
    return applyCookieCleanup(
      NextResponse.redirect(new URL("/dashboard", req.url))
    );
  }

  // Redirect unauthenticated users to login
  if (!isLoginPage && !isLoggedIn) {
    return applyCookieCleanup(
      NextResponse.redirect(new URL("/login", req.url))
    );
  }

  if (isAdminRoute && req.auth?.user?.role !== "admin") {
    return applyCookieCleanup(
      NextResponse.redirect(new URL("/dashboard", req.url))
    );
  }

  return applyCookieCleanup(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
