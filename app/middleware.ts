import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserByEmailAction } from "@/app/actions/users";
export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const user = token?.email;
  console.log("Current user email:", user);
  const userobj = await getUserByEmailAction(user || "");
  console.log("User role:", userobj?.role);

  // Protect /creator route
  if (req.nextUrl.pathname.startsWith("/creator")) {
    if (!(userobj?.role === "admin" || userobj?.role === "creator")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/creator/:path*"],
};
