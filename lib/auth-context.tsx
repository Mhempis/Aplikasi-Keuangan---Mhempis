"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  provider: "google" | "credentials"
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: (googleProfile?: { email: string; name?: string; picture?: string }) => Promise<void>
  logout: () => void
}

const STORAGE_KEY_AUTH = "pf_dashboard_auth_user_v1"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_AUTH)
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (e) {
      console.error("Failed to load auth user:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveUserSession = (authUser: AuthUser | null) => {
    setUser(authUser)
    if (authUser) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authUser))
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH)
    }
  }

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || "Email atau kata sandi salah!" }
      }

      saveUserSession(data.user)
      return { success: true }
    } catch (e) {
      console.error("Email login error:", e)
      return { success: false, error: "Gagal terhubung ke server autentikasi." }
    }
  }

  const loginWithGoogle = async (googleProfile?: { email: string; name?: string; picture?: string }) => {
    const profileToUse = googleProfile || {
      email: "diddy.christ@gmail.com",
      name: "Diddy Christ (Google SSO)",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diddy",
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "google", googleProfile: profileToUse }),
      })

      if (res.ok) {
        const data = await res.json()
        saveUserSession(data.user)
      } else {
        saveUserSession({
          id: `usr_g_${Date.now()}`,
          name: profileToUse.name || "User Google",
          email: profileToUse.email,
          avatar: profileToUse.picture,
          provider: "google",
        })
      }
    } catch (e) {
      saveUserSession({
        id: `usr_g_${Date.now()}`,
        name: profileToUse.name || "User Google",
        email: profileToUse.email,
        avatar: profileToUse.picture,
        provider: "google",
      })
    }
  }

  const logout = () => {
    saveUserSession(null)
  }

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
