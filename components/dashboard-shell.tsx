"use client"

import { AuthProvider, type AuthUser } from "@/lib/auth-context"
import { FinanceProvider } from "@/lib/finance-context"
import { VisibilityProvider } from "@/lib/visibility-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuickAddTransaction } from "@/components/quick-add-transaction"
import { SummaryStats } from "@/components/summary-stats"
import { BalanceCards } from "@/components/balance-cards"
import { RecentTransactions } from "@/components/recent-transactions"
import { SpendingChart } from "@/components/spending-chart"
import { SavingsSection } from "@/components/savings-section"

/**
 * Kerangka dashboard (client) — user berasal dari sesi server, bukan dari localStorage.
 * Urutan sengaja dibuat: form tambah transaksi ada di layar pertama, bagian
 * lain (tabungan, grafik) ada di bawah supaya tampilan lebih ringkas.
 */
export function DashboardShell({ user }: { user: AuthUser }) {
  return (
    <AuthProvider initialUser={user}>
      <FinanceProvider>
        <VisibilityProvider>
          <main className="min-h-screen bg-[#111827] px-4 py-6 sm:px-6 lg:px-8 text-gray-100 selection:bg-[#3B82F6] selection:text-white">
            <div className="mx-auto flex max-w-5xl flex-col gap-5">
              <DashboardHeader />

              {/* FORM TAMBAH TRANSAKSI — selalu terlihat di halaman pertama */}
              <QuickAddTransaction />

              <SummaryStats />

              <div id="rekening-section">
                <BalanceCards />
              </div>

              <RecentTransactions />

              {/* Bagian sekunder — dilipat supaya halaman depan tetap ringkas */}
              <details className="group rounded-xl border border-white/5 bg-[#1F2937]/60 p-4">
                <summary className="cursor-pointer list-none text-sm font-bold text-gray-200 marker:content-none">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-[#3B82F6] transition-transform group-open:rotate-90">▶</span>
                    Grafik Analisis Pengeluaran
                    <span className="text-xs font-normal text-gray-400">(klik untuk buka)</span>
                  </span>
                </summary>
                <div className="mt-4">
                  <SpendingChart />
                </div>
              </details>
            </div>
          </main>
        </VisibilityProvider>
      </FinanceProvider>
    </AuthProvider>
  )
}
