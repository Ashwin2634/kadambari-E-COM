import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/** RBAC gate: everything under /admin requires a signed-in user with role === "admin". */
export default withAuth(
  function middleware(req) {
    if (req.nextauth.token?.role !== "admin") return NextResponse.redirect(new URL("/login?error=forbidden", req.url));
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = { matcher: ["/admin/:path*"] };
