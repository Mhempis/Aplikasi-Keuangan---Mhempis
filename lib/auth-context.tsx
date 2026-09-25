"use client"

import React, { createContext, useCallback, useContext, useState } from "react"
import { useRouter } from "next/navigation"

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  provider: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth context tipis di atas sesi server (cookie HttpOnly).
 * TIDAK ada lagi: localStorage sebagai sumber kebenaran, fallback "login Google" palsu,
 * atau data kredensial yang bisa diubah dari browser.
 */
export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      })
      const data = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string }

      if (!res.ok || !data.user) {
        return { success: false, error: data.error || "Email atau kata sandi salah." }
      }

      setUser(data.user)
      router.replace("/")
      router.refresh()
      return { success: true }
    } catch {
      return { success: false, error: "Gagal terhubung ke server autentikasi." }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const loginWithGoogle = useCallback(() => {
    setIsLoading(true)
    // Redirect penuh ke alur OAuth server (Authorization Code + state anti-CSRF).
    window.location.href = "/api/auth/google"
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" })
    } finally {
      setUser(null)
      router.replace("/login")
      router.refresh()
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
