"use client"

import { useState } from "react"
import { X, PlusCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { type AccountId, type TransactionType } from "@/lib/finance-data"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  defaultType?: TransactionType
}

export function TransactionModal({ isOpen, onClose, defaultType = "expense" }: TransactionModalProps) {
  const { accounts, categories, addTransaction } = useFinance()
  const [type, setType] = useState<TransactionType>(defaultType)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")

  const filteredCategories = categories.filter((c) => c.type === type)
  const [category, setCategory] = useState<string>("")
  const [accountId, setAccountId] = useState<string>("")

  // Nilai efektif dihitung saat render agar selalu sinkron dengan rekening/kategori yang
  // benar-benar ada di database. (Sebelumnya default-nya string keras "bca"/"mandiri",
  // sehingga penyimpanan selalu ditolak server saat rekening asli punya ID berbeda.)
  const effectiveCategory =
    category || filteredCategories[0]?.name || (type === "expense" ? "Groceries" : "Gaji")
  const effectiveAccountId = accountId || accounts[0]?.id || ""

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ""))
    if (!description.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Harap isi deskripsi dan nominal yang valid!")
      return
    }
    if (!effectiveAccountId) {
      alert("Belum ada rekening aktif. Tambahkan rekening dulu di menu Master Data.")
      return
    }

    addTransaction({
      description,
      amount: numericAmount,
      type,
      category: effectiveCategory,
      accountId: effectiveAccountId,
    })

    // Reset & close
    setDescription("")
    setAmount("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1F2937] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="size-5 text-[#3B82F6]" />
            Tambah Transaksi Baru
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#111827] p-1.5 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setType("expense")
                const firstExp = categories.find((c) => c.type === "expense")?.name || "Groceries"
                setCategory(firstExp)
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                type === "expense"
                  ? "bg-[#EF4444] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowDownCircle className="size-4" />
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income")
                const firstInc = categories.find((c) => c.type === "income")?.name || "Gaji"
                setCategory(firstInc)
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                type === "income"
                  ? "bg-[#10B981] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowUpCircle className="size-4" />
              Pemasukan
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Nominal (Rp)
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Contoh: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-lg font-semibold text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Deskripsi Transaksi
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Belanja Sayur & Buah"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Kategori
            </label>
            <select
              value={effectiveCategory}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Akun / Pembayaran
            </label>
            <select
              value={effectiveAccountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: Rp {acc.balance.toLocaleString("id-ID")})
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-[#3B82F6]/90 active:scale-[0.98]"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
