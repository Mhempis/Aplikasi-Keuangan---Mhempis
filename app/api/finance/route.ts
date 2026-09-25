import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { initialAccounts, initialTransactions, initialSavingsGoals, initialCategories } from "@/lib/finance-data"

async function seedDatabaseIfEmpty() {
  const accountCount = await prisma.account.count()
  if (accountCount === 0) {
    // Seed Accounts
    for (const acc of initialAccounts) {
      await prisma.account.create({
        data: {
          id: acc.id,
          name: acc.name,
          balance: acc.balance,
          updatedAt: new Date(acc.updatedAt),
        },
      })
    }

    // Seed Transactions
    for (const tx of initialTransactions) {
      await prisma.transaction.create({
        data: {
          id: tx.id,
          date: new Date(tx.date),
          description: tx.description,
          category: tx.category,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          accountId: tx.accountId,
        },
      })
    }

    // Seed Savings Goals
    for (const goal of initialSavingsGoals) {
      await prisma.savingsGoal.create({
        data: {
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
          category: goal.category,
          color: goal.color,
          accountId: goal.accountId,
        },
      })
    }

    // Seed Categories
    for (const cat of initialCategories) {
      await prisma.categoryItem.create({
        data: {
          name: cat.name,
          type: cat.type,
          color: cat.color,
        },
      })
    }
  }
}

export async function GET() {
  try {
    await seedDatabaseIfEmpty()

    const [accounts, transactions, savingsGoals, categories] = await Promise.all([
      prisma.account.findMany({ orderBy: { name: "asc" } }),
      prisma.transaction.findMany({ orderBy: { date: "desc" } }),
      prisma.savingsGoal.findMany({ orderBy: { name: "asc" } }),
      prisma.categoryItem.findMany({ orderBy: { name: "asc" } }),
    ])

    return NextResponse.json({
      accounts: accounts.map((a) => ({ ...a, updatedAt: a.updatedAt.toISOString() })),
      transactions: transactions.map((t) => ({ ...t, date: t.date.toISOString() })),
      savingsGoals: savingsGoals.map((g) => ({ ...g, targetDate: g.targetDate ? g.targetDate.toISOString() : undefined })),
      categories,
    })
  } catch (error) {
    console.error("GET /api/finance Error:", error)
    return NextResponse.json({ error: "Failed to fetch finance data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json()
    if (action === "reset") {
      await prisma.transaction.deleteMany()
      await prisma.savingsGoal.deleteMany()
      await prisma.account.deleteMany()
      await prisma.categoryItem.deleteMany()
      await seedDatabaseIfEmpty()

      return NextResponse.json({ message: "Database reset to defaults successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/finance Error:", error)
    return NextResponse.json({ error: "Failed to reset finance data" }, { status: 500 })
  }
}
