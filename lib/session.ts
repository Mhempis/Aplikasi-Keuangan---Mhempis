import { cookies } from "next/headers"
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  cookieSecurityOptions,
  signSession,
  verifySessionToken,
  type SessionUser,
} from "@/lib/session-token"

export {
  SESSION_COOKIE,
  OAUTH_STATE_COOKIE,
  SESSION_TTL_SECONDS,
  oauthStateCookieOptions,
  appOrigin,
  createOAuthState,
  signSession,
  toPublicUser,
  verifyOAuthState,
  verifySessionToken,
} from "@/lib/session-token"

export type { SessionUser, DbUserLike } from "@/lib/session-token"

/** Set cookie sesi (hanya dari Route Handler / Server Action). */
export async function startSession(user: SessionUser): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, signSession(user), { ...cookieSecurityOptions(), maxAge: SESSION_TTL_SECONDS })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, "", { ...cookieSecurityOptions(), maxAge: 0 })
}

/** User yang sedang login, dibaca dari cookie HttpOnly dan diverifikasi tanda tangannya. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/** Nilai + opsi cookie untuk dipasang manual pada NextResponse (kasus redirect). */
export function sessionCookie(user: SessionUser) {
  return {
    name: SESSION_COOKIE,
    value: signSession(user),
    options: { ...cookieSecurityOptions(), maxAge: SESSION_TTL_SECONDS },
  }
}
