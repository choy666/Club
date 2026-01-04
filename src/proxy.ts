import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ADMIN_ONLY_PREFIXES = ["/admin"];
const MEMBER_ONLY_PREFIXES = ["/socio"];

const SIGN_IN_PATH = "/api/auth/signin";
const HOME_PATH = "/";

function buildRedirect(url: URL, pathname: string) {
  return NextResponse.redirect(new URL(pathname, url.origin));
}

function needsAuth(pathname: string) {
  return (
    ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    MEMBER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export default auth((req) => {
  const session = req.auth;
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  if (!session?.user) {
    if (needsAuth(pathname)) {
      const signInUrl = new URL(SIGN_IN_PATH, nextUrl.origin);
      signInUrl.searchParams.set("callbackUrl", nextUrl.href);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  const role = session.user.role;

  if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && role !== "ADMIN") {
    return buildRedirect(nextUrl, "/socio");
  }

  if (
    MEMBER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    role !== "USER" &&
    role !== "ADMIN"
  ) {
    return buildRedirect(nextUrl, HOME_PATH);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/socio/:path*"],
};
