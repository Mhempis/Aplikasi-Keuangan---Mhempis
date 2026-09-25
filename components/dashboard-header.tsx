"use client"

import { useState } from "react"
import { ShieldCheck, Settings, RefreshCw, LogOut } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { useAuth } from "@/lib/auth-context"
import { MasterDataModal } from "./master-data-modal"

/**
 * Header dashboard versi ringkas: hanya sapaan + tombol penting.
 * Angka ringkasan (kekayaan bersih, pemasukan, dll) dipindah ke <SummaryStats />
 * supaya form tambah transaksi bisa naik ke layar pertama.
 */
export function DashboardHeader() {
  const { resetToDefaultData } = useFinance()
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
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1F2937] via-[#111827] to-[#1F2937] px-4 py-3.5 shadow-lg">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#3B82F6]">
            <ShieldCheck className="size-3.5 text-[#10B981]" />
            Aplikasi Keuangan Rumah Tangga
          </div>
          <h1 className="mt-0.5 truncate text-xl font-black text-white sm:text-2xl">
            Halo, <span className="text-[#3B82F6]">{displayName}</span> 👋
          </h1>
          {displayEmail && <p className="truncate text-[11px] text-gray-400">{displayEmail}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsMasterModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-3.5 py-2 text-xs font-bold text-white shadow transition-colors hover:bg-[#3B82F6]/90"
          >
            <Settings className="size-4" />
            Master Data
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            title="Reset ke data demo"
          >
            <RefreshCw className="size-3.5" />
            Reset Demo
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs font-bold text-[#EF4444] transition-colors hover:bg-[#EF4444]/20"
            title="Keluar dari akun"
          >
            <LogOut className="size-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <MasterDataModal isOpen={isMasterModalOpen} onClose={() => setIsMasterModalOpen(false)} />
    </>
  )
}
