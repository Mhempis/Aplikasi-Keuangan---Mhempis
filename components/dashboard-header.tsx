"use client"

import { useState } from "react"
import { Wallet, TrendingUp, TrendingDown, RefreshCw, ShieldCheck, Settings, LogOut } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { useAuth } from "@/lib/auth-context"
import { formatCurrency } from "@/lib/finance-data"
import { MasterDataModal } from "./master-data-modal"

export function DashboardHeader() {
  const { totalBalance, totalIncome, totalExpense, totalSavings, resetToDefaultData } = useFinance()
  const { user, logout } = useAuth()
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false)

  const handleReset = () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan data ke pengaturan awal (demo)?")) {
      resetToDefaultData()
    }
  }

  const displayName = user?.name || "Budi & Keluarga"
  const displayEmail = user?.email || ""

  return (
    <>
      <header className="space-y-4">
        {/* Top Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1F2937] via-[#111827] to-[#1F2937] p-5 shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#3B82F6] uppercase tracking-wider">
              <ShieldCheck className="size-4 text-[#10B981]" />
              Aplikasi Keuangan Rumah Tangga
            </div>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Halo, <span className="text-[#3B82F6]">{displayName}</span> 👋
            </h1>
            {displayEmail && <p className="text-xs text-gray-400 mt-0.5">{displayEmail}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsMasterModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#3B82F6]/90 transition-colors shadow"
            >
              <Settings className="size-4" />
              Master Data
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              title="Reset ke data demo"
            >
              <RefreshCw className="size-3.5" />
              Reset Demo
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
              title="Keluar dari akun"
            >
              <LogOut className="size-3.5" />
              Keluar
            </button>
          </div>
        </div>

        {/* Overview Stat Widgets */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Net Worth */}
          <div className="rounded-xl border border-white/5 bg-[#1F2937] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Total Kekayaan Bersih</span>
              <div className="rounded-lg bg-[#3B82F6]/15 p-2 text-[#3B82F6]">
                <Wallet className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalBalance)}</p>
            <p className="mt-1 text-[11px] text-gray-400">Total semua saldo akun</p>
          </div>

          {/* Total Income */}
          <div className="rounded-xl border border-white/5 bg-[#1F2937] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Total Pemasukan</span>
              <div className="rounded-lg bg-[#10B981]/15 p-2 text-[#10B981]">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#10B981]">{formatCurrency(totalIncome)}</p>
            <p className="mt-1 text-[11px] text-gray-400">Catatan pemasukan aktif</p>
          </div>

          {/* Total Expense */}
          <div className="rounded-xl border border-white/5 bg-[#1F2937] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Total Pengeluaran</span>
              <div className="rounded-lg bg-[#EF4444]/15 p-2 text-[#EF4444]">
                <TrendingDown className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#EF4444]">{formatCurrency(totalExpense)}</p>
            <p className="mt-1 text-[11px] text-gray-400">Catatan pengeluaran aktif</p>
          </div>

          {/* Total Savings */}
          <div className="rounded-xl border border-white/5 bg-[#1F2937] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Total Terkumpul Tabungan</span>
              <div className="rounded-lg bg-[#8B5CF6]/15 p-2 text-[#8B5CF6]">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#8B5CF6]">{formatCurrency(totalSavings)}</p>
            <p className="mt-1 text-[11px] text-gray-400">Alokasi target tabungan</p>
          </div>
        </div>
      </header>

      <MasterDataModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
      />
    </>
  )
}
