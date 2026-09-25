"use client"

import { useState } from "react"
import { Search, Trash2, Filter } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, formatDate, type TransactionStatus } from "@/lib/finance-data"

const statusStyles: Record<TransactionStatus, string> = {
  completed: "bg-[#10B981]/15 text-[#10B981]",
  pending: "bg-[#F59E0B]/15 text-[#F59E0B]",
  failed: "bg-[#EF4444]/15 text-[#EF4444]",
}

const statusLabels: Record<TransactionStatus, string> = {
  completed: "Berhasil",
  pending: "Tertunda",
  failed: "Gagal",
}

export function RecentTransactions() {
  const { transactions, accounts, deleteTransaction } = useFinance()
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === "all" || tx.type === filterType
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const getAccountName = (accId?: string) => {
    const acc = accounts.find((a) => a.id === accId)
    return acc ? acc.name : "-"
  }

  return (
    <section
      aria-label="Transaksi terbaru"
      className="rounded-xl border border-white/5 bg-[#1F2937] p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Catatan Transaksi Harian</h2>
          <p className="text-xs text-gray-400">Daftar riwayat pemasukan & pengeluaran</p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter Buttons */}
          <div className="flex rounded-lg bg-[#111827] p-1 border border-white/10 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                filterType === "all" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType("expense")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                filterType === "expense" ? "bg-[#EF4444] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setFilterType("income")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                filterType === "income" ? "bg-[#10B981] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Pemasukan
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari transaksi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#111827] pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
        />
      </div>

      {/* Mobile-Friendly List View (visible on small screens) */}
      <div className="mt-4 space-y-3 sm:hidden">
        {filteredTransactions.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">Tidak ada transaksi ditemukan.</p>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-[#111827] p-3.5"
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                    {tx.category}
                  </span>
                  <span className="text-[10px] text-gray-400">{getAccountName(tx.accountId)}</span>
                </div>
                <p className="text-sm font-semibold text-white line-clamp-1">{tx.description}</p>
                <p className="text-[11px] text-gray-400">{formatDate(tx.date)}</p>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  className={`text-sm font-bold ${
                    tx.type === "expense" ? "text-[#EF4444]" : "text-[#10B981]"
                  }`}
                >
                  {tx.type === "expense" ? "-" : "+"}
                  {formatCurrency(tx.amount)}
                </span>
                <button
                  onClick={() => deleteTransaction(tx.id)}
                  className="p-1 text-gray-500 hover:text-[#EF4444] transition-colors"
                  title="Hapus transaksi"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, visible on sm and up) */}
      <div className="mt-4 hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
              <th scope="col" className="pb-3 pr-4 font-medium">Tanggal</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Deskripsi</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Kategori</th>
              <th scope="col" className="pb-3 pr-4 font-medium">Akun</th>
              <th scope="col" className="pb-3 pr-4 text-right font-medium">Jumlah</th>
              <th scope="col" className="pb-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-gray-400">
                  Tidak ada transaksi ditemukan.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap py-3 pr-4 text-xs text-gray-300">{formatDate(tx.date)}</td>
                  <td className="py-3 pr-4 text-white font-medium">{tx.description}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-300">{tx.category}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-400">{getAccountName(tx.accountId)}</td>
                  <td
                    className={`whitespace-nowrap py-3 pr-4 text-right font-bold ${
                      tx.type === "expense" ? "text-[#EF4444]" : "text-[#10B981]"
                    }`}
                  >
                    {tx.type === "expense" ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="rounded p-1 text-gray-400 hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
                      title="Hapus transaksi"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
