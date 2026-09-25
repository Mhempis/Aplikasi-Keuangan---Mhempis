import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, balance } = await req.json()
    if (!name) return NextResponse.json({ error: "Account name is required" }, { status: 400 })

    const id = `acc_${Date.now()}`
    const account = await prisma.account.create({
      data: {
        id,
        name,
        balance: parseFloat(balance) || 0,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ account: { ...account, updatedAt: account.updatedAt.toISOString() } })
  } catch (error) {
    console.error("POST /api/accounts Error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, balance } = await req.json()
    if (!id || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const account = await prisma.account.update({
      where: { id },
      data: {
        name,
        balance: parseFloat(balance) || 0,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ account: { ...account, updatedAt: account.updatedAt.toISOString() } })
  } catch (error) {
    console.error("PUT /api/accounts Error:", error)
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const count = await prisma.account.count()
    if (count <= 1) return NextResponse.json({ error: "Cannot delete the only account" }, { status: 400 })

    await prisma.account.delete({ where: { id } })
    return NextResponse.json({ message: "Account deleted" })
  } catch (error) {
    console.error("DELETE /api/accounts Error:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { fromAccountId, toAccountId, amount } = await req.json()
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid transfer parameters" }, { status: 400 })
    }

    const fromAcc = await prisma.account.findUnique({ where: { id: fromAccountId } })
    const toAcc = await prisma.account.findUnique({ where: { id: toAccountId } })
    if (!fromAcc || !toAcc || fromAcc.balance < parseFloat(amount)) {
      return NextResponse.json({ error: "Insufficient account balance" }, { status: 400 })
    }

    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: parseFloat(amount) }, updatedAt: now },
      })
      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: parseFloat(amount) }, updatedAt: now },
      })
    })

    return NextResponse.json({ message: "Account transfer successful" })
  } catch (error) {
    console.error("PATCH /api/accounts Error:", error)
    return NextResponse.json({ error: "Failed to transfer between accounts" }, { status: 500 })
  }
}
