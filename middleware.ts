import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export default clerkMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhook(.*)",
    "/login",
    "/register",
    "/favicon.ico",
    "/api/(.*)",
  ],

  // Function to run when a user is not authenticated
  afterAuth(auth, req) {
    // Handle redirects from /login to /sign-in and /register to /sign-up
    if (req.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    if (req.nextUrl.pathname === "/register") {
      return NextResponse.redirect(new URL("/sign-up", req.url))
    }

    // If the user is not authenticated and trying to access a protected route
    if (!auth.userId && !auth.isPublicRoute) {
      // Redirect to sign-in, passing the current URL as the "redirect_url"
      const signInUrl = new URL("/sign-in", req.url)
      signInUrl.searchParams.set("redirect_url", req.url)
      return NextResponse.redirect(signInUrl)
    }

    // If the user is authenticated and trying to access auth pages
    if (
      auth.userId &&
      (req.nextUrl.pathname === "/sign-in" ||
        req.nextUrl.pathname === "/sign-up" ||
        req.nextUrl.pathname === "/login" ||
        req.nextUrl.pathname === "/register")
    ) {
      // Redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}

