import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, type, color } = await req.json()
    if (!name || !type) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const category = await prisma.categoryItem.create({
      data: {
        name,
        type,
        color: color || "#3B82F6",
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error("POST /api/categories Error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get("name")
    const type = searchParams.get("type")
    if (!name || !type) return NextResponse.json({ error: "Missing required query params" }, { status: 400 })

    await prisma.categoryItem.deleteMany({
      where: { name, type },
    })

    return NextResponse.json({ message: "Category deleted" })
  } catch (error) {
    console.error("DELETE /api/categories Error:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
