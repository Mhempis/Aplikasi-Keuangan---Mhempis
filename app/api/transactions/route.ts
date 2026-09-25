import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { description, amount, type, category, accountId } = await req.json()
    if (!description || !amount || amount <= 0 || !type || !accountId) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const id = `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date()

    const transaction = await prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          id,
          description,
          amount: parseFloat(amount),
          type,
          category,
          accountId,
          date: now,
          status: "completed",
        },
      })

      const delta = type === "income" ? parseFloat(amount) : -parseFloat(amount)
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: { increment: delta },
          updatedAt: now,
        },
      })

      return newTx
    })

    return NextResponse.json({ transaction: { ...transaction, date: transaction.date.toISOString() } })
  } catch (error) {
    console.error("POST /api/transactions Error:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const existingTx = await prisma.transaction.findUnique({ where: { id } })
    if (!existingTx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id } })
      const revertDelta = existingTx.type === "income" ? -existingTx.amount : existingTx.amount

      await tx.account.update({
        where: { id: existingTx.accountId },
        data: {
          balance: { increment: revertDelta },
          updatedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ message: "Transaction deleted" })
  } catch (error) {
    console.error("DELETE /api/transactions Error:", error)
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
  }
}
