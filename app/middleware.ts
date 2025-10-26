import { auth } from "../lib/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const role = (req as any).auth?.user?.role as "admin" | "creator" | "learner" | undefined;

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/creator") && !(role === "admin" || role === "creator")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*", "/creator/:path*"] };
