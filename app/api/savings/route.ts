import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { ownedAccount } from "@/lib/seed"
import { cleanId, cleanText, isHexColor, isValidDate, parseAmount } from "@/lib/validation"

const DEFAULT_GOAL_CATEGORY = "Lainnya"
const DEFAULT_COLOR = "#3B82F6"

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const name = cleanText(body?.name, 60)
    const targetAmount = parseAmount(body?.targetAmount)
    const accountId = cleanId(body?.accountId)
    const category = cleanText(body?.category, 60) ?? DEFAULT_GOAL_CATEGORY
    const color = isHexColor(body?.color) ? body.color : DEFAULT_COLOR
    const targetDate = isValidDate(body?.targetDate) ? new Date(body.targetDate as string) : null

    if (!name || targetAmount === null || !accountId) {
      return NextResponse.json({ error: "Data target tabungan tidak valid." }, { status: 400 })
    }

    // Rekening tujuan WAJIB milik user ini.
    const account = await ownedAccount(user.id, accountId)
    if (!account) return NextResponse.json({ error: "Rekening tidak ditemukan." }, { status: 404 })

    const goal = await prisma.savingsGoal.create({
      data: {
        id: `s_${randomUUID()}`,
        name,
        targetAmount,
        currentAmount: 0,
        category,
        color,
        accountId,
        userId: user.id,
        targetDate,
      },
    })

    return NextResponse.json({
      goal: { ...goal, targetDate: goal.targetDate ? goal.targetDate.toISOString() : undefined },
    })
  } catch (error) {
    console.error("POST /api/savings Error:", error)
    return NextResponse.json({ error: "Gagal membuat target tabungan." }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const type = body?.type

    // 1. Setoran ke tabungan
    if (type === "deposit") {
      const goalId = cleanId(body?.goalId)
      const amount = parseAmount(body?.amount)
      if (!goalId || amount === null) {
        return NextResponse.json({ error: "Parameter setoran tidak valid." }, { status: 400 })
      }

      const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId: user.id } })
      if (!goal) return NextResponse.json({ error: "Target tabungan tidak ditemukan." }, { status: 404 })

      const account = await ownedAccount(user.id, goal.accountId)
      if (!account) return NextResponse.json({ error: "Rekening sumber tidak ditemukan." }, { status: 404 })

      // Tanpa cek ini, setoran bisa membuat saldo rekening jadi negatif.
      if (account.balance < amount) {
        return NextResponse.json({ error: "Saldo rekening tidak cukup untuk setoran ini." }, { status: 400 })
      }

      const now = new Date()
      await prisma.$transaction(async (tx) => {
        await tx.savingsGoal.update({
          where: { id: goalId },
          data: { currentAmount: { increment: amount } },
        })

        await tx.account.update({
          where: { id: goal.accountId },
          data: { balance: { decrement: amount }, updatedAt: now },
        })

        await tx.transaction.create({
          data: {
            id: `t_${randomUUID()}`,
            description: `Setoran Tabungan: ${goal.name}`,
            amount,
            type: "expense",
            category: "Investasi & Dividen",
            accountId: goal.accountId,
            userId: user.id,
            date: now,
            status: "completed",
          },
        })
      })

      return NextResponse.json({ message: "Setoran tabungan berhasil." })
    }

    // 2. Pindah dana antar target tabungan
    if (type === "transfer") {
      const fromGoalId = cleanId(body?.fromGoalId)
      const toGoalId = cleanId(body?.toGoalId)
      const amount = parseAmount(body?.amount)

      if (!fromGoalId || !toGoalId || amount === null || fromGoalId === toGoalId) {
        return NextResponse.json({ error: "Parameter transfer tidak valid." }, { status: 400 })
      }

      const fromGoal = await prisma.savingsGoal.findFirst({ where: { id: fromGoalId, userId: user.id } })
      const toGoal = await prisma.savingsGoal.findFirst({ where: { id: toGoalId, userId: user.id } })

      if (!fromGoal || !toGoal) {
        return NextResponse.json({ error: "Target tabungan tidak ditemukan." }, { status: 404 })
      }
      if (fromGoal.currentAmount < amount) {
        return NextResponse.json({ error: "Dana pada target sumber tidak cukup." }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.savingsGoal.update({
          where: { id: fromGoalId },
          data: { currentAmount: { decrement: amount } },
        }),
        prisma.savingsGoal.update({
          where: { id: toGoalId },
          data: { currentAmount: { increment: amount } },
        }),
      ])

      return NextResponse.json({ message: "Transfer antar tabungan berhasil." })
    }

    return NextResponse.json({ error: "Jenis operasi tabungan tidak dikenal." }, { status: 400 })
  } catch (error) {
    console.error("PUT /api/savings Error:", error)
    return NextResponse.json({ error: "Gagal memperbarui tabungan." }, { status: 500 })
  }
}
