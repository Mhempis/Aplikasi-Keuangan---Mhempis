import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"

/** Sesi aktif (terverifikasi dari cookie HttpOnly). */
export async function GET() {
  const user = await getSessionUser()
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } })
}
