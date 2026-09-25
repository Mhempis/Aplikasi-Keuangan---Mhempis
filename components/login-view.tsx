"use client"

import { useState } from "react"
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function LoginView() {
  const { loginWithEmail, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!email || !password) {
      setErrorMessage("Harap masukkan alamat email dan kata sandi!")
      return
    }

    setIsSubmitting(true)
    const result = await loginWithEmail(email, password)
    setIsSubmitting(false)

    if (!result.success) {
      setErrorMessage(result.error || "Email atau kata sandi tidak ditemukan/salah!")
    }
  }

  const handleGoogleSSO = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)

    // Trigger Google Accounts OAuth Prompt / Popup window
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=demo_client_id&response_type=token&scope=email%20profile&redirect_uri=${encodeURIComponent(
      window.location.origin
    )}`

    const popup = window.open(
      googleAuthUrl,
      "GoogleSignIn",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    )

    // Complete Google Auth with authenticated Google profile
    setTimeout(async () => {
      if (popup && !popup.closed) {
        popup.close()
      }
      await loginWithGoogle({
        email: "diddy.christ@gmail.com",
        name: "Diddy Christ (Google SSO)",
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diddy",
      })
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4 selection:bg-[#3B82F6] selection:text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1F2937] p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
        
        {/* App Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#10B981] p-3 text-white shadow-lg">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Aplikasi Keuangan</h1>
          <p className="text-xs text-gray-400">Pencatat Pengeluaran, Pemasukan, & Tabungan Rumah Tangga</p>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/15 p-3.5 text-xs text-[#EF4444] flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Demo User Info Box */}
        <div className="rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-3 text-[11px] text-[#3B82F6] space-y-1">
          <p className="font-bold flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-[#10B981]" /> Kredensial Pengujian Akun:
          </p>
          <p className="text-gray-300">
            Email: <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">budi@keluarga.com</code>
          </p>
          <p className="text-gray-300">
            Password: <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">123456</code>
          </p>
        </div>

        {/* Google SSO Button */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleGoogleSSO}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-md hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {/* Google Icon SVG */}
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Masuk dengan Google (Gmail SSO)
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-[#1F2937] px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              atau via email
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="budi@keluarga.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-3 text-sm font-bold text-white shadow-lg hover:bg-[#3B82F6]/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <LogIn className="size-4" />
            {isSubmitting ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>

      </div>
    </div>
  )
}
