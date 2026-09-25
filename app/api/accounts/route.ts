import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { cleanId, cleanText, parseAmount } from "@/lib/validation"

const MAX_ACCOUNTS_PER_USER = 20

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const name = cleanText(body?.name, 60)
    const balance = parseAmount(body?.balance, { allowZero: true }) ?? 0

    if (!name) return NextResponse.json({ error: "Nama rekening wajib diisi." }, { status: 400 })

    const count = await prisma.account.count({ where: { userId: user.id } })
    if (count >= MAX_ACCOUNTS_PER_USER) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_ACCOUNTS_PER_USER} rekening per pengguna.` },
        { status: 400 }
      )
    }

    const now = new Date()
    const account = await prisma.account.create({
      data: {
        id: `acc_${randomUUID()}`,
        name,
        balance,
        updatedAt: now,
        userId: user.id,
      },
    })

    return NextResponse.json({ account: { ...account, updatedAt: account.updatedAt.toISOString() } })
  } catch (error) {
    console.error("POST /api/accounts Error:", error)
    return NextResponse.json({ error: "Gagal membuat rekening." }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const id = cleanId(body?.id)
    const name = cleanText(body?.name, 60)
    const balance = parseAmount(body?.balance, { allowZero: true })

    if (!id || !name || balance === null) {
      return NextResponse.json({ error: "Data rekening tidak valid." }, { status: 400 })
    }

    // Cek kepemilikan dulu — update() dengan where:{id} saja bisa mengubah rekening user lain.
    const owned = await prisma.account.findFirst({ where: { id, userId: user.id } })
    if (!owned) return NextResponse.json({ error: "Rekening tidak ditemukan." }, { status: 404 })

    const account = await prisma.account.update({
      where: { id },
      data: { name, balance, updatedAt: new Date() },
    })

    return NextResponse.json({ account: { ...account, updatedAt: account.updatedAt.toISOString() } })
  } catch (error) {
    console.error("PUT /api/accounts Error:", error)
    return NextResponse.json({ error: "Gagal memperbarui rekening." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = cleanId(searchParams.get("id"))
  if (!id) return NextResponse.json({ error: "ID rekening tidak valid." }, { status: 400 })

  try {
    const owned = await prisma.account.findFirst({ where: { id, userId: user.id } })
    if (!owned) return NextResponse.json({ error: "Rekening tidak ditemukan." }, { status: 404 })

    const count = await prisma.account.count({ where: { userId: user.id } })
    if (count <= 1) {
      return NextResponse.json({ error: "Tidak bisa menghapus satu-satunya rekening." }, { status: 400 })
    }

    await prisma.account.delete({ where: { id } })
    return NextResponse.json({ message: "Rekening dihapus." })
  } catch (error) {
    console.error("DELETE /api/accounts Error:", error)
    return NextResponse.json({ error: "Gagal menghapus rekening." }, { status: 500 })
  }
}

/** Transfer antar rekening milik user sendiri. */
export async function PATCH(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const fromAccountId = cleanId(body?.fromAccountId)
    const toAccountId = cleanId(body?.toAccountId)
    const amount = parseAmount(body?.amount)

    if (!fromAccountId || !toAccountId || amount === null || fromAccountId === toAccountId) {
      return NextResponse.json({ error: "Parameter transfer tidak valid." }, { status: 400 })
    }

    const fromAcc = await prisma.account.findFirst({ where: { id: fromAccountId, userId: user.id } })
    const toAcc = await prisma.account.findFirst({ where: { id: toAccountId, userId: user.id } })

    if (!fromAcc || !toAcc) {
      return NextResponse.json({ error: "Rekening tidak ditemukan." }, { status: 404 })
    }
    if (fromAcc.balance < amount) {
      return NextResponse.json({ error: "Saldo rekening sumber tidak cukup." }, { status: 400 })
    }

    const now = new Date()
    await prisma.$transaction([
      prisma.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount }, updatedAt: now },
      }),
      prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount }, updatedAt: now },
      }),
    ])

    return NextResponse.json({ message: "Transfer antar rekening berhasil." })
  } catch (error) {
    console.error("PATCH /api/accounts Error:", error)
    return NextResponse.json({ error: "Gagal melakukan transfer." }, { status: 500 })
  }
}
