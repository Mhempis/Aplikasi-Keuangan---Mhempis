"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  provider: "google" | "email"
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithEmail: (email: string, password: string) => Promise<boolean>
  loginWithGoogle: () => Promise<void>
  logout: () => void
}

const STORAGE_KEY_AUTH = "pf_dashboard_auth_user_v1"

const defaultGoogleUser: AuthUser = {
  id: "usr_google_budi",
  name: "Budi Christ",
  email: "budi.christ@gmail.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
  provider: "google",
}

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

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) return false
    const emailUser: AuthUser = {
      id: `usr_${Date.now()}`,
      name: email.split("@")[0] || "User Keuangan",
      email,
      provider: "email",
    }
    saveUserSession(emailUser)
    return true
  }

  const loginWithGoogle = async (): Promise<void> => {
    // Simulate instant Google SSO Auth
    saveUserSession(defaultGoogleUser)
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
