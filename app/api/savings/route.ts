import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, targetAmount, category, color, accountId, targetDate } = await req.json()
    if (!name || !targetAmount || targetAmount <= 0 || !accountId) {
      return NextResponse.json({ error: "Invalid savings goal data" }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        id: `s_${Date.now()}`,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        category: category || "Lainnya",
        color: color || "#3B82F6",
        accountId,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
    })

    return NextResponse.json({
      goal: { ...goal, targetDate: goal.targetDate ? goal.targetDate.toISOString() : undefined },
    })
  } catch (error) {
    console.error("POST /api/savings Error:", error)
    return NextResponse.json({ error: "Failed to create savings goal" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { type, goalId, amount, fromGoalId, toGoalId } = await req.json()

    // 1. Deposit to savings
    if (type === "deposit") {
      if (!goalId || !amount || amount <= 0) return NextResponse.json({ error: "Invalid deposit" }, { status: 400 })
      const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } })
      if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 })

      const now = new Date()
      await prisma.$transaction(async (tx) => {
        await tx.savingsGoal.update({
          where: { id: goalId },
          data: { currentAmount: { increment: parseFloat(amount) } },
        })

        await tx.account.update({
          where: { id: goal.accountId },
          data: { balance: { decrement: parseFloat(amount) }, updatedAt: now },
        })

        await tx.transaction.create({
          data: {
            id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            description: `Setoran Tabungan: ${goal.name}`,
            amount: parseFloat(amount),
            type: "expense",
            category: "Investasi & Dividen",
            accountId: goal.accountId,
            date: now,
            status: "completed",
          },
        })
      })

      return NextResponse.json({ message: "Deposit successful" })
    }

    // 2. Transfer between savings
    if (type === "transfer") {
      if (!fromGoalId || !toGoalId || !amount || amount <= 0) return NextResponse.json({ error: "Invalid transfer" }, { status: 400 })
      const fromGoal = await prisma.savingsGoal.findUnique({ where: { id: fromGoalId } })
      const toGoal = await prisma.savingsGoal.findUnique({ where: { id: toGoalId } })
      if (!fromGoal || !toGoal || fromGoal.currentAmount < parseFloat(amount)) {
        return NextResponse.json({ error: "Insufficient funds in source goal" }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        await tx.savingsGoal.update({
          where: { id: fromGoalId },
          data: { currentAmount: { decrement: parseFloat(amount) } },
        })
        await tx.savingsGoal.update({
          where: { id: toGoalId },
          data: { currentAmount: { increment: parseFloat(amount) } },
        })
      })

      return NextResponse.json({ message: "Savings transfer successful" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("PUT /api/savings Error:", error)
    return NextResponse.json({ error: "Failed to update savings" }, { status: 500 })
  }
}
