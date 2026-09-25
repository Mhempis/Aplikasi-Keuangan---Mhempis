import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * Inti kriptografi sesi — TANPA dependensi next/headers, supaya bisa dipakai
 * dari proxy.ts (node runtime) maupun route handler.
 */

export const SESSION_COOKIE = "pf_session"
export const OAUTH_STATE_COOKIE = "pf_oauth_state"

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 hari
const STATE_TTL_SECONDS = 60 * 10 // 10 menit

export interface SessionUser {
  id: string
  name: string
  email: string
  avatar?: string
  provider: string
}

export interface DbUserLike {
  id: string
  name: string
  email: string
  image?: string | null
  provider: string
}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET belum diset atau terlalu pendek (minimal 32 karakter).")
  }
  return secret
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url")
}

function signature(body: string): Buffer {
  return createHmac("sha256", authSecret()).update(body).digest()
}

/** Data user yang aman dikirim ke browser (tanpa hash password). */
export function toPublicUser(user: DbUserLike): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.image ?? undefined,
    provider: user.provider,
  }
}

/** Token sesi bertanda tangan HMAC — tidak bisa dipalsukan tanpa AUTH_SECRET. */
export function signSession(user: SessionUser): string {
  const payload = {
    uid: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar ?? null,
    provider: user.provider,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const body = b64url(JSON.stringify(payload))
  return `v1.${body}.${b64url(signature(body))}`
}

/** Verifikasi token sesi; null kalau tanda tangan atau masa berlaku tidak valid. */
export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null

  const parts = token.split(".")
  if (parts.length !== 3 || parts[0] !== "v1") return null

  const [, body, providedSig] = parts
  if (!body || !providedSig) return null

  let expected: Buffer
  try {
    expected = signature(body)
  } catch {
    return null
  }

  const provided = Buffer.from(providedSig, "base64url")
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>
    if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) return null
    if (typeof payload.uid !== "string" || !payload.uid) return null
    if (typeof payload.email !== "string" || typeof payload.name !== "string") return null

    return {
      id: payload.uid,
      email: payload.email,
      name: payload.name,
      avatar: typeof payload.avatar === "string" ? payload.avatar : undefined,
      provider: typeof payload.provider === "string" ? payload.provider : "credentials",
    }
  } catch {
    return null
  }
}

/* ---------------- OAuth state (anti-CSRF) ---------------- */

export function createOAuthState(): string {
  const nonce = randomBytes(16).toString("hex")
  const body = b64url(`${nonce}.${Date.now()}`)
  return `${body}.${b64url(signature(body))}`
}

export function verifyOAuthState(state: string | undefined | null): boolean {
  if (!state) return false

  const parts = state.split(".")
  if (parts.length !== 3) return false

  const [bodyB64, timeB64, sigB64] = parts
  let expected: Buffer
  try {
    expected = signature(`${bodyB64}.${timeB64}`)
  } catch {
    return false
  }

  const provided = Buffer.from(sigB64, "base64url")
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false

  const timePart = Buffer.from(timeB64, "base64url").toString("utf8")
  const issuedAt = Number(timePart.split(".")[1])
  if (!Number.isFinite(issuedAt)) return false
  return Date.now() - issuedAt <= STATE_TTL_SECONDS * 1000
}

export function cookieSecurityOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.APP_URL?.startsWith("https") === true,
  }
}

export function oauthStateCookieOptions() {
  return { ...cookieSecurityOptions(), maxAge: STATE_TTL_SECONDS }
}

/** Origin aplikasi untuk redirect OAuth (hindari salah skema di belakang proxy). */
export function appOrigin(req: Request): string {
  const configured = process.env.APP_URL?.trim()
  if (configured) return configured.replace(/\/+$/, "")
  return new URL(req.url).origin
}
