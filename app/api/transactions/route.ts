import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { ownedAccount } from "@/lib/seed"
import { TRANSACTION_TYPES, cleanId, cleanText, isEnum, parseAmount } from "@/lib/validation"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null

    const description = cleanText(body?.description, 120)
    const amount = parseAmount(body?.amount)
    const type = isEnum(body?.type, TRANSACTION_TYPES) ? body.type : null
    const category = cleanText(body?.category, 60) ?? "Lainnya"
    const accountId = cleanId(body?.accountId)

    if (!description || amount === null || !type || !accountId) {
      return NextResponse.json({ error: "Data transaksi tidak valid." }, { status: 400 })
    }

    // Rekening WAJIB milik user ini (anti IDOR / anti NaN).
    const account = await ownedAccount(user.id, accountId)
    if (!account) {
      return NextResponse.json({ error: "Rekening tidak ditemukan." }, { status: 404 })
    }

    if (type === "expense" && account.balance < amount) {
      return NextResponse.json({ error: "Saldo rekening tidak cukup." }, { status: 400 })
    }

    const now = new Date()
    const delta = type === "income" ? amount : -amount

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          id: `t_${randomUUID()}`,
          description,
          amount,
          type,
          category,
          accountId,
          userId: user.id,
          date: now,
          status: "completed",
        },
      })

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: delta }, updatedAt: now },
      })

      return created
    })

    return NextResponse.json({
      transaction: { ...transaction, date: transaction.date.toISOString() },
    })
  } catch (error) {
    console.error("POST /api/transactions Error:", error)
    return NextResponse.json({ error: "Gagal menyimpan transaksi." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = cleanId(searchParams.get("id"))
  if (!id) return NextResponse.json({ error: "ID transaksi tidak valid." }, { status: 400 })

  try {
    const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id } })

      const revertDelta = existing.type === "income" ? -existing.amount : existing.amount
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: revertDelta }, updatedAt: new Date() },
      })
    })

    return NextResponse.json({ message: "Transaksi dihapus." })
  } catch (error) {
    console.error("DELETE /api/transactions Error:", error)
    return NextResponse.json({ error: "Gagal menghapus transaksi." }, { status: 500 })
  }
}
