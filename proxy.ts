import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token"

/**
 * Proxy (dulu bernama middleware) — Next.js 16.
 * Tugas: menahan request yang belum punya sesi valid sebelum menyentuh halaman/API.
 *
 * Catatan keamanan: ini LAPIS PERTAMA saja. Setiap route handler & server component
 * tetap memverifikasi sendiri lewat getSessionUser() (defense in depth).
 */

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/google",
  "/api/auth/google/callback",
])

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (session) return NextResponse.next()

  // API: balas 401 JSON, jangan redirect HTML
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/login"
  loginUrl.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml|woff|woff2|css|js|map)$).*)",
  ],
}
