import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>

const KEYLEN = 64
const SALT_BYTES = 16
/** Hash dummy: dipakai supaya waktu verifikasi untuk email yang tidak ada tetap mirip (anti user-enumeration lewat timing). */
export const DUMMY_HASH = "scrypt$00000000000000000000000000000000$" + "0".repeat(KEYLEN * 2)

/** Hash password dengan scrypt + salt acak. Format: scrypt$<salt-hex>$<hash-hex> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex")
  const derived = await scrypt(password, salt, KEYLEN)
  return `scrypt$${salt}$${derived.toString("hex")}`
}

/** Verifikasi password terhadap hash tersimpan. Selalu pakai perbandingan constant-time. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    // Tetap jalankan scrypt supaya durasi respons tidak membocorkan apakah email terdaftar.
    await verifyPassword(password, DUMMY_HASH)
    return false
  }

  const parts = stored.split("$")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false

  const [, salt, expectedHex] = parts
  if (!/^[0-9a-f]+$/i.test(expectedHex)) return false

  const expected = Buffer.from(expectedHex, "hex")
  let derived: Buffer
  try {
    derived = await scrypt(password, salt, expected.length || KEYLEN)
  } catch {
    return false
  }

  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
