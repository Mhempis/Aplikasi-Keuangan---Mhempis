import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { initialAccounts, initialTransactions, initialSavingsGoals, initialCategories } from "@/lib/finance-data"

async function ensureUserExists(userId: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: "Pengguna Keuangan",
        email: `${userId}@keuangan.com`,
        provider: "credentials",
      },
    })
  }
  return user
}

async function seedUserFinanceDataIfEmpty(userId: string) {
  await ensureUserExists(userId)
  const accountCount = await prisma.account.count({ where: { userId } })

  if (accountCount === 0) {
    // Seed Accounts for this specific user
    for (const acc of initialAccounts) {
      await prisma.account.create({
        data: {
          id: `${acc.id}_${userId}`,
          name: acc.name,
          balance: acc.balance,
          updatedAt: new Date(acc.updatedAt),
          userId,
        },
      })
    }

    // Seed Transactions for this specific user
    for (const tx of initialTransactions) {
      await prisma.transaction.create({
        data: {
          id: `${tx.id}_${userId}`,
          date: new Date(tx.date),
          description: tx.description,
          category: tx.category,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          accountId: `${tx.accountId}_${userId}`,
          userId,
        },
      })
    }

    // Seed Savings Goals for this specific user
    for (const goal of initialSavingsGoals) {
      await prisma.savingsGoal.create({
        data: {
          id: `${goal.id}_${userId}`,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
          category: goal.category,
          color: goal.color,
          accountId: `${goal.accountId}_${userId}`,
          userId,
        },
      })
    }

    // Seed Categories for this specific user
    for (const cat of initialCategories) {
      await prisma.categoryItem.create({
        data: {
          name: cat.name,
          type: cat.type,
          color: cat.color,
          userId,
        },
      })
    }
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = req.headers.get("x-user-id") || searchParams.get("userId") || "usr_default"

    await seedUserFinanceDataIfEmpty(userId)

    const [accounts, transactions, savingsGoals, categories] = await Promise.all([
      prisma.account.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.savingsGoal.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.categoryItem.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    ])

    return NextResponse.json({
      accounts: accounts.map((a) => ({ ...a, updatedAt: a.updatedAt.toISOString() })),
      transactions: transactions.map((t) => ({ ...t, date: t.date.toISOString() })),
      savingsGoals: savingsGoals.map((g) => ({ ...g, targetDate: g.targetDate ? g.targetDate.toISOString() : undefined })),
      categories,
    })
  } catch (error) {
    console.error("GET /api/finance Error:", error)
    return NextResponse.json({ error: "Failed to fetch isolated finance data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { action, userId: bodyUserId } = await req.json()
    const userId = req.headers.get("x-user-id") || bodyUserId || "usr_default"

    if (action === "reset") {
      await prisma.transaction.deleteMany({ where: { userId } })
      await prisma.savingsGoal.deleteMany({ where: { userId } })
      await prisma.account.deleteMany({ where: { userId } })
      await prisma.categoryItem.deleteMany({ where: { userId } })

      await seedUserFinanceDataIfEmpty(userId)

      return NextResponse.json({ message: "User data reset successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/finance Error:", error)
    return NextResponse.json({ error: "Failed to reset user finance data" }, { status: 500 })
  }
}
