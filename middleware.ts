import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user?.id;
  const hasUsername = !!session?.user?.username;
  const isAdmin = session?.user?.isAdmin === true;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/discover", req.url));
    }
    return NextResponse.next();
  }

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicProfile = pathname.startsWith("/u/");
  const isDiscover = pathname.startsWith("/discover");
  const isOnboarding = pathname.startsWith("/onboarding");

  const protectedPaths = ["/add", "/scan"];
  const needsAuth = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if ((needsAuth || isOnboarding) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && !hasUsername && !isOnboarding && !isAuthPage) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (isLoggedIn && hasUsername && isOnboarding) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(
      new URL(hasUsername ? "/" : "/onboarding", req.url),
    );
  }

  if (
    !isLoggedIn &&
    !isAuthPage &&
    !isPublicProfile &&
    !isDiscover &&
    needsAuth
  ) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/test|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
