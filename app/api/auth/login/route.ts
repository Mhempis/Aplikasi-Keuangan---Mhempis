import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"
import { sessionCookie, toPublicUser } from "@/lib/session"
import { cleanText } from "@/lib/validation"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { ensureUserSeeded } from "@/lib/seed"

/**
 * Login kredensial (email + password).
 * - Password diverifikasi dengan scrypt + perbandingan constant-time (lib/password.ts).
 * - Sukses = cookie sesi HttpOnly bertanda tangan HMAC.
 * - Tidak ada lagi jalur "Google" palsu yang menerima profil dari body request.
 */
export async function POST(req: Request) {
  try {
    const limit = rateLimit(`login:${clientIp(req)}`, 10, 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan masuk. Coba lagi sebentar lagi." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      )
    }

    const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null
    const email = cleanText(body?.email, 160, 3)?.toLowerCase() ?? null
    const password = typeof body?.password === "string" ? body.password : null

    if (!email || !password || password.length > 200) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi!" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // verifyPassword tetap dijalankan walau user tidak ada (anti timing/enumeration).
    const passwordOk = await verifyPassword(password, user?.password ?? null)

    if (!user || !passwordOk) {
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 })
    }

    await ensureUserSeeded(user.id)

    const cookie = sessionCookie(toPublicUser(user))
    const res = NextResponse.json({ user: toPublicUser(user) })
    res.cookies.set(cookie.name, cookie.value, cookie.options)
    return res
  } catch (error) {
    console.error("POST /api/auth/login Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan pada server autentikasi." }, { status: 500 })
  }
}
