import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const workspaceRedirects: Record<string, string> = {
  "/attendance": "attendance",
  "/submissions": "submissions",
  "/murajaah": "murajaah",
  "/students": "students",
  "/progress": "progress",
  "/settings": "settings",
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const panel = workspaceRedirects[pathname];
  if (panel) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("panel", panel);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
