/**
 * Validasi input minimal untuk semua API route.
 * Semua nilai dari client DIPERLAGAKAN tidak dipercaya.
 */

const MAX_AMOUNT = 1_000_000_000_000_000 // 1 kuadriliun, batas wajar anti overflow

/** Angka uang: harus number/string numerik, finite, > 0, dan di bawah batas. */
export function parseAmount(value: unknown, opts: { allowZero?: boolean } = {}): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null
  if (typeof value === "string" && value.trim() === "") return null

  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return null
  if (opts.allowZero ? num < 0 : num <= 0) return null
  if (Math.abs(num) > MAX_AMOUNT) return null

  // batasi maksimal 2 desimal supaya tidak ada pecahan sen aneh
  return Math.round(num * 100) / 100
}

/** Teks wajib: string, di-trim, tidak kosong, tanpa karakter kontrol, max length. */
export function cleanText(value: unknown, maxLength: number, minLength = 1): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().replace(/[\u0000-\u001f\u007f]/g, "")
  if (trimmed.length < minLength || trimmed.length > maxLength) return null
  return trimmed
}

/** Cek nilai termasuk daftar yang diizinkan. */
export function isEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value)
}

/** ID dari client (dipakai untuk cari baris yang memang milik user). */
export function cleanId(value: unknown, maxLength = 128): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) return null
  if (!/^[A-Za-z0-9_.:-]+$/.test(trimmed)) return null
  return trimmed
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false
  return !Number.isNaN(new Date(value).getTime())
}

export const TRANSACTION_TYPES = ["income", "expense"] as const
export const TRANSACTION_STATUSES = ["completed", "pending", "failed"] as const
