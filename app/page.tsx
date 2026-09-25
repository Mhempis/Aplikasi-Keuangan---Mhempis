import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard-shell"

export const dynamic = "force-dynamic"

/**
 * Halaman dashboard — SERVER component.
 * Sesi diverifikasi di server sebelum render; tanpa sesi langsung dialihkan ke /login.
 * Tidak ada lagi pemeriksaan "login" di sisi browser yang bisa diakali dari localStorage.
 */
export default async function Page() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  return <DashboardShell user={user} />
}
