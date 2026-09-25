import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function seedDefaultUserIfEmpty() {
  const userCount = await prisma.user.count()
  if (userCount === 0) {
    await prisma.user.create({
      data: {
        name: "Budi & Keluarga",
        email: "budi@keluarga.com",
        password: "123456",
        provider: "credentials",
      },
    })
  }
}

export async function POST(req: Request) {
  try {
    await seedDefaultUserIfEmpty()
    const { email, password, action, googleProfile } = await req.json()

    // 1. Real Google SSO Authentication Handler
    if (action === "google" && googleProfile) {
      const { email: gEmail, name: gName, picture: gPicture } = googleProfile
      if (!gEmail) return NextResponse.json({ error: "Invalid Google Profile" }, { status: 400 })

      let user = await prisma.user.findUnique({ where: { email: gEmail } })
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: gEmail,
            name: gName || gEmail.split("@")[0],
            image: gPicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gEmail}`,
            provider: "google",
          },
        })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.image,
          provider: "google",
        },
      })
    }

    // 2. Real Email & Password Credential Authentication Handler
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi!" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Strict Credential Validation: Error if email not found or password incorrect!
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak ditemukan/salah! Silakan periksa kembali." },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.image,
        provider: user.provider,
      },
    })
  } catch (error) {
    console.error("Auth API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server autentikasi." }, { status: 500 })
  }
}
