/**
 * Rate limiter sederhana in-memory (per instance).
 * Cukup untuk menghentikan brute-force login pada deployment single-instance.
 * CATATAN: pada serverless multi-instance, ganti dengan Redis/Upstash.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 10_000

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()

  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
    if (buckets.size > MAX_KEYS) buckets.clear()
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 }
}

/**
 * Ambil IP client dari header proxy.
 * CATATAN: dipakai nilai PALING KANAN dari x-forwarded-for, karena itu IP yang
 * ditambahkan oleh reverse proxy kita sendiri (nginx). Kalau dipakai nilai paling
 * kiri, client bisa mengirim header X-Forwarded-For palsu untuk mengakali limiter.
 */
export function clientIp(req: Request): string {
  const headers = req.headers
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]!
  }
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown"
}
