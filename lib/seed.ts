import { prisma } from "@/lib/prisma"
import {
  initialAccounts,
  initialTransactions,
  initialSavingsGoals,
  initialCategories,
} from "@/lib/finance-data"

/**
 * Isi data awal untuk user ini HANYA kalau user ini belum punya rekening.
 * Semua penulisan dilakukan dengan createMany (1 query per tabel), bukan loop await.
 */
export async function ensureUserSeeded(userId: string): Promise<void> {
  const accountCount = await prisma.account.count({ where: { userId } })
  if (accountCount > 0) return

  const now = new Date()

  try {
    await prisma.$transaction([
      prisma.account.createMany({
        data: initialAccounts.map((acc) => ({
          id: `${acc.id}_${userId}`,
          name: acc.name,
          balance: acc.balance,
          updatedAt: new Date(acc.updatedAt),
          userId,
        })),
      }),
      prisma.transaction.createMany({
        data: initialTransactions.map((tx) => ({
          id: `${tx.id}_${userId}`,
          date: new Date(tx.date),
          description: tx.description,
          category: tx.category,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          accountId: `${tx.accountId}_${userId}`,
          userId,
        })),
      }),
      prisma.savingsGoal.createMany({
        data: initialSavingsGoals.map((goal) => ({
          id: `${goal.id}_${userId}`,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
          category: goal.category,
          color: goal.color,
          accountId: `${goal.accountId}_${userId}`,
          userId,
        })),
      }),
      prisma.categoryItem.createMany({
        data: initialCategories.map((cat) => ({
          name: cat.name,
          type: cat.type,
          color: cat.color,
          userId,
        })),
      }),
    ])
  } catch (error) {
    // Dua request pertama yang datang bersamaan bisa balapan; abaikan kalau barisnya sudah ada.
    console.error("ensureUserSeeded gagal (kemungkinan balapan request):", error)
  }
}

/** Validasi internal: pastikan rekening benar-benar milik user ini (anti IDOR). */
export async function ownedAccount(userId: string, accountId: string) {
  return prisma.account.findFirst({ where: { id: accountId, userId } })
}
