/**
 * Buat/atur ulang akun contoh untuk uji coba.
 * Password disimpan sebagai hash scrypt (TIDAK ada lagi password plaintext di database).
 *
 * Jalankan:  node scripts/seed-demo.mjs
 * Atur email/password lewat env: SEED_EMAIL, SEED_PASSWORD
 */
import { PrismaClient } from "@prisma/client"
import { randomBytes, scrypt as scryptCb } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCb)
const prisma = new PrismaClient()

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const derived = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${derived.toString("hex")}`
}

const email = (process.env.SEED_EMAIL || "budi@keluarga.com").toLowerCase()
const password = process.env.SEED_PASSWORD || "Keuangan#2026"

if (password.length < 8) {
  console.error("Password minimal 8 karakter.")
  process.exit(1)
}

const passwordHash = await hashPassword(password)

const user = await prisma.user.upsert({
  where: { email },
  update: { password: passwordHash, provider: "credentials" },
  create: {
    email,
    name: "Budi & Keluarga",
    password: passwordHash,
    provider: "credentials",
  },
})

console.log(`Akun siap -> email: ${user.email} | id: ${user.id}`)
console.log("Password mengikuti env SEED_PASSWORD (default: Keuangan#2026)")
console.log("Data contoh (rekening/transaksi/tabungan) otomatis diisi saat login pertama.")

await prisma.$disconnect()
