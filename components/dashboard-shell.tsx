"use client"

import { AuthProvider, type AuthUser } from "@/lib/auth-context"
import { FinanceProvider } from "@/lib/finance-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { BalanceCards } from "@/components/balance-cards"
import { QuickActions } from "@/components/quick-actions"
import { RecentTransactions } from "@/components/recent-transactions"
import { SpendingChart } from "@/components/spending-chart"
import { SavingsSection } from "@/components/savings-section"

/**
 * Kerangka dashboard (client) — user berasal dari sesi server, bukan dari localStorage.
 */
export function DashboardShell({ user }: { user: AuthUser }) {
  return (
    <AuthProvider initialUser={user}>
      <FinanceProvider>
        <main className="min-h-screen bg-[#111827] px-4 py-6 sm:px-6 lg:px-8 text-gray-100 selection:bg-[#3B82F6] selection:text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            <DashboardHeader />
            <BalanceCards />
            <QuickActions />
            <div id="savings-section">
              <SavingsSection />
            </div>
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
    </AuthProvider>
  )
}
