"use client"

import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { FinanceProvider } from "@/lib/finance-context"
import { LoginView } from "@/components/login-view"
import { DashboardHeader } from "@/components/dashboard-header"
import { BalanceCards } from "@/components/balance-cards"
import { QuickActions } from "@/components/quick-actions"
import { RecentTransactions } from "@/components/recent-transactions"
import { SpendingChart } from "@/components/spending-chart"
import { SavingsSection } from "@/components/savings-section"

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1F2937] p-6 shadow-xl">
          <div className="size-5 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-gray-300">Memuat Sesi Keuangan...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <LoginView />
  }

  return (
    <FinanceProvider>
      <main className="min-h-screen bg-[#111827] px-4 py-6 sm:px-6 lg:px-8 text-gray-100 selection:bg-[#3B82F6] selection:text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          {/* Header & Financial Overview */}
          <DashboardHeader />

          {/* Account Balances */}
          <BalanceCards />

          {/* Quick Actions Bar */}
          <QuickActions />

          {/* Household Savings Goals Section */}
          <div id="savings-section">
            <SavingsSection />
          </div>

          {/* Transactions & Spending Analytics Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-start">
            <div className="lg:col-span-3">
              <RecentTransactions />
            </div>
            <div className="lg:col-span-2">
              <SpendingChart />
            </div>
          </div>
        </div>
      </main>
    </FinanceProvider>
  )
}

export default function Page() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1F2937] p-6 shadow-xl">
          <div className="size-5 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-gray-300">Memuat Dashboard Keuangan...</p>
        </div>
      </main>
    )
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
