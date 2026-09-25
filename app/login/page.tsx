import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/session"
import { AuthProvider } from "@/lib/auth-context"
import { LoginView } from "@/components/login-view"

export const dynamic = "force-dynamic"

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Login Google belum diaktifkan (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET belum diisi).",
  state_invalid: "Sesi login Google tidak valid atau kedaluwarsa. Silakan coba lagi.",
  token_exchange_failed: "Gagal menukar kode otorisasi dengan Google.",
  userinfo_failed: "Gagal mengambil profil dari Google.",
  email_not_verified: "Email Google Anda belum terverifikasi.",
  google_login_failed: "Login Google gagal. Silakan coba lagi atau pakai email & kata sandi.",
  code_missing: "Login Google dibatalkan.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getSessionUser()
  if (user) redirect("/")

  const { error } = await searchParams
  const initialError = error ? ERROR_MESSAGES[error] ?? "Login gagal. Silakan coba lagi." : null
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

  return (
    <AuthProvider initialUser={null}>
      <LoginView initialError={initialError} googleEnabled={googleEnabled} />
    </AuthProvider>
  )
}
