import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import {
  OAUTH_STATE_COOKIE,
  appOrigin,
  sessionCookie,
  toPublicUser,
  verifyOAuthState,
} from "@/lib/session"
import { ensureUserSeeded } from "@/lib/seed"

interface GoogleTokenResponse {
  access_token?: string
  id_token?: string
}

interface GoogleProfile {
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

/**
 * Callback OAuth Google.
 * - `state` diverifikasi ganda: harus sama dengan cookie HttpOnly DAN tanda tangannya valid.
 * - Pertukaran `code` -> token dilakukan server-to-server dengan client_secret.
 * - Identitas diambil dari endpoint userinfo Google (bukan dari input client!), dan
 *   hanya email yang sudah terverifikasi Google yang diterima.
 */
export async function GET(req: Request) {
  const origin = appOrigin(req)

  const fail = (reason: string) => {
    const url = new URL("/login", origin)
    url.searchParams.set("error", reason)
    const res = NextResponse.redirect(url)
    res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 })
    return res
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) return fail("google_not_configured")

    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    const store = await cookies()
    const cookieState = store.get(OAUTH_STATE_COOKIE)?.value

    if (!state || !cookieState || state !== cookieState || !verifyOAuthState(state)) {
      return fail("state_invalid")
    }
    if (!code) return fail("code_missing")

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    })
    if (!tokenRes.ok) return fail("token_exchange_failed")

    const tokens = (await tokenRes.json()) as GoogleTokenResponse
    if (!tokens.access_token) return fail("token_exchange_failed")

    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    })
    if (!infoRes.ok) return fail("userinfo_failed")

    const profile = (await infoRes.json()) as GoogleProfile
    const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : null
    if (!email || profile.email_verified === false) return fail("email_not_verified")

    const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : email.split("@")[0]
    const image = typeof profile.picture === "string" ? profile.picture : null

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, image, provider: "google" },
      create: { email, name, image, provider: "google" },
    })

    await ensureUserSeeded(user.id)

    const cookie = sessionCookie(toPublicUser(user))
    const res = NextResponse.redirect(new URL("/", origin))
    res.cookies.set(cookie.name, cookie.value, cookie.options)
    res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 })
    return res
  } catch (error) {
    console.error("GET /api/auth/google/callback Error:", error)
    return fail("google_login_failed")
  }
}
