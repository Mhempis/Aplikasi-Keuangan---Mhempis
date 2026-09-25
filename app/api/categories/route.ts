import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { TRANSACTION_TYPES, cleanText, isEnum, isHexColor } from "@/lib/validation"

const DEFAULT_COLOR = "#3B82F6"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const name = cleanText(body?.name, 60)
    const type = isEnum(body?.type, TRANSACTION_TYPES) ? body.type : null
    const color = isHexColor(body?.color) ? body.color : DEFAULT_COLOR

    if (!name || !type) {
      return NextResponse.json({ error: "Nama dan jenis kategori wajib diisi." }, { status: 400 })
    }

    const category = await prisma.categoryItem.create({
      data: { name, type, color, userId: user.id },
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Kategori dengan nama ini sudah ada." }, { status: 409 })
    }
    console.error("POST /api/categories Error:", error)
    return NextResponse.json({ error: "Gagal membuat kategori." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const name = cleanText(searchParams.get("name"), 60)
  const typeParam = searchParams.get("type")
  const type = isEnum(typeParam, TRANSACTION_TYPES) ? typeParam : null

  if (!name || !type) {
    return NextResponse.json({ error: "Parameter nama dan jenis kategori wajib diisi." }, { status: 400 })
  }

  try {
    // deleteMany tetap dibatasi userId dari sesi — tidak bisa menghapus kategori user lain.
    const result = await prisma.categoryItem.deleteMany({ where: { name, type, userId: user.id } })
    if (result.count === 0) {
      return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 })
    }

    return NextResponse.json({ message: "Kategori dihapus." })
  } catch (error) {
    console.error("DELETE /api/categories Error:", error)
    return NextResponse.json({ error: "Gagal menghapus kategori." }, { status: 500 })
  }
}
