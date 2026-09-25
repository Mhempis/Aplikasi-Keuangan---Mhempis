import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { ensureUserSeeded } from "@/lib/seed"

/**
 * Data keuangan user yang sedang login.
 * userId diambil dari sesi terverifikasi — BUKAN dari header/query/body yang bisa dikarang.
 */

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = user.id

  try {
    await ensureUserSeeded(userId)

    const [accounts, transactions, savingsGoals, categories] = await Promise.all([
      prisma.account.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.savingsGoal.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.categoryItem.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    ])

    return NextResponse.json(
      {
        accounts: accounts.map((a) => ({ ...a, updatedAt: a.updatedAt.toISOString() })),
        transactions: transactions.map((t) => ({ ...t, date: t.date.toISOString() })),
        savingsGoals: savingsGoals.map((g) => ({
          ...g,
          targetDate: g.targetDate ? g.targetDate.toISOString() : undefined,
        })),
        categories,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("GET /api/finance Error:", error)
    return NextResponse.json({ error: "Gagal memuat data keuangan." }, { status: 500 })
  }
}

/** Reset data user ini ke data contoh (hanya data miliknya sendiri). */
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { action?: unknown } | null
  if (body?.action !== "reset") {
    return NextResponse.json({ error: "Action tidak dikenal." }, { status: 400 })
  }

  const userId = user.id

  try {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.savingsGoal.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.categoryItem.deleteMany({ where: { userId } }),
    ])

    await ensureUserSeeded(userId)

    return NextResponse.json({ message: "Data dikembalikan ke data contoh." })
  } catch (error) {
    console.error("POST /api/finance Error:", error)
    return NextResponse.json({ error: "Gagal mereset data keuangan." }, { status: 500 })
  }
}
