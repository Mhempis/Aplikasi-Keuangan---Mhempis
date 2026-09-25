import { NextResponse } from "next/server"
import { OAUTH_STATE_COOKIE, appOrigin, createOAuthState, oauthStateCookieOptions } from "@/lib/session"

/**
 * Mulai login Google (OAuth 2.0 Authorization Code + PKCE-less confidential client).
 * Butuh GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET. Kalau belum diisi, redirect ke /login
 * dengan pesan bahwa Google login belum dikonfigurasi (tidak ada jalur login palsu).
 */
export async function GET(req: Request) {
  const origin = appOrigin(req)
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    const url = new URL("/login", origin)
    url.searchParams.set("error", "google_not_configured")
    return NextResponse.redirect(url)
  }

  const state = createOAuthState()

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("prompt", "select_account")

  const res = NextResponse.redirect(authUrl)
  res.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions())
  return res
}
