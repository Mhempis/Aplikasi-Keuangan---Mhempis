"use client"

import { useState, useMemo } from "react"
import { Search, Trash2, Filter, X, Calendar } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { useVisibility } from "@/lib/visibility-context"
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

type DateFilter = "all" | "today" | "week" | "month" | "custom"

export function RecentTransactions() {
  const { transactions, accounts, categories, deleteTransaction } = useFinance()
  const { isAmountVisible } = useVisibility()
  
  // Filter states
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Get unique categories from transactions
  const usedCategories = useMemo(() => {
    const cats = new Set(transactions.map(tx => tx.category))
    return Array.from(cats).sort()
  }, [transactions])

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      const matchesType = filterType === "all" || tx.type === filterType

      // Search filter
      const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tx.category.toLowerCase().includes(searchQuery.toLowerCase())

      // Date filter
      let matchesDate = true
      const txDate = new Date(tx.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dateFilter === "today") {
        const txDateOnly = new Date(txDate)
        txDateOnly.setHours(0, 0, 0, 0)
        matchesDate = txDateOnly.getTime() === today.getTime()
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        matchesDate = txDate >= weekAgo
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        matchesDate = txDate >= monthAgo
      } else if (dateFilter === "custom" && customStartDate && customEndDate) {
        const start = new Date(customStartDate)
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        matchesDate = txDate >= start && txDate <= end
      }

      // Account filter
      const matchesAccount = selectedAccount === "all" || tx.accountId === selectedAccount

      // Category filter
      const matchesCategory = selectedCategory === "all" || tx.category === selectedCategory

      // Amount filter
      let matchesAmount = true
      if (minAmount && tx.amount < parseFloat(minAmount)) matchesAmount = false
      if (maxAmount && tx.amount > parseFloat(maxAmount)) matchesAmount = false

      return matchesType && matchesSearch && matchesDate && matchesAccount && matchesCategory && matchesAmount
    })
  }, [transactions, filterType, searchQuery, dateFilter, customStartDate, customEndDate, selectedAccount, selectedCategory, minAmount, maxAmount])

  const getAccountName = (accId?: string) => {
    const acc = accounts.find((a) => a.id === accId)
    return acc ? acc.name : "-"
  }

  const formatAmount = (amount: number) => {
    if (!isAmountVisible) return "••••••"
    return formatCurrency(amount)
  }

  const clearAllFilters = () => {
    setFilterType("all")
    setSearchQuery("")
    setDateFilter("all")
    setCustomStartDate("")
    setCustomEndDate("")
    setSelectedAccount("all")
    setSelectedCategory("all")
    setMinAmount("")
    setMaxAmount("")
  }

  const activeFilterCount = [
    filterType !== "all",
    searchQuery.length > 0,
    dateFilter !== "all",
    selectedAccount !== "all",
    selectedCategory !== "all",
    minAmount.length > 0 || maxAmount.length > 0
  ].filter(Boolean).length

  return (
    <section
      aria-label="Transaksi terbaru"
      className="rounded-xl border border-white/5 bg-[#1F2937] p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Catatan Transaksi Harian</h2>
            <p className="text-xs text-gray-400">
              {filteredTransactions.length} dari {transactions.length} transaksi
              {activeFilterCount > 0 && ` (${activeFilterCount} filter aktif)`}
            </p>
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
          >
            <Filter className="size-4" />
            {showAdvancedFilters ? "Sembunyikan" : "Filter Lanjutan"}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#3B82F6] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Basic Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
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

          {/* Date Quick Filter */}
          <div className="flex rounded-lg bg-[#111827] p-1 border border-white/10 text-xs">
            <button
              onClick={() => setDateFilter("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                dateFilter === "all" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setDateFilter("today")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                dateFilter === "today" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                dateFilter === "week" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter("month")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                dateFilter === "month" ? "bg-[#3B82F6] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              30 Hari
            </button>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-2.5 py-1 text-xs font-medium text-[#EF4444] transition-colors hover:bg-[#EF4444]/20"
            >
              <X className="size-3" />
              Reset Filter
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari deskripsi atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111827] pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
          />
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#111827] p-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">
                    <Calendar className="inline size-3 mr-1" />
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-300">
                    <Calendar className="inline size-3 mr-1" />
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
              </>
            )}

            {dateFilter !== "custom" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Periode Custom</label>
                <button
                  onClick={() => setDateFilter("custom")}
                  className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-gray-400 hover:text-white hover:border-[#3B82F6] transition-colors text-left"
                >
                  <Calendar className="inline size-3 mr-1" />
                  Pilih Rentang Tanggal
                </button>
              </div>
            )}

            {/* Account Filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Rekening</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
              >
                <option value="all">Semua Rekening</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                {usedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Nominal Min (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-300">Nominal Max (Rp)</label>
              <input
                type="number"
                placeholder="999999999"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile-Friendly List View (visible on small screens) */}
      <div className="mt-4 space-y-3 sm:hidden">
        {filteredTransactions.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            {transactions.length === 0 ? "Tidak ada transaksi." : "Tidak ada transaksi yang sesuai filter."}
          </p>
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
                  {formatAmount(tx.amount)}
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
                  {transactions.length === 0 ? "Tidak ada transaksi." : "Tidak ada transaksi yang sesuai filter."}
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
                    {formatAmount(tx.amount)}
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
