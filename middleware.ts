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

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isPublicProfile = pathname.startsWith("/u/");
  const isDiscover = pathname.startsWith("/discover");
  const isNews = pathname.startsWith("/news");
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

  // Username checks use the database in server pages (getSessionUser), not here.
  // Middleware only reads the JWT, which can lag behind the database and cause
  // redirect loops between / and /onboarding.

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
    !isNews &&
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
