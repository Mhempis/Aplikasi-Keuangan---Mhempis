"use client"

import { useState } from "react"
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, CheckCircle2, AlertCircle, Save } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { type TransactionType } from "@/lib/finance-data"
import { TransferModal } from "./transfer-modal"

/**
 * Form tambah transaksi INLINE — sengaja ditaruh paling atas dashboard
 * supaya begitu halaman dibuka, form-nya langsung kelihatan tanpa scroll.
 * (Sebelumnya harus klik tombol lalu muncul modal.)
 */
export function QuickAddTransaction() {
  const { accounts, categories, addTransaction } = useFinance()

  const [type, setType] = useState<TransactionType>("expense")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [accountId, setAccountId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  // Nilai efektif dihitung saat render supaya selalu sinkron dengan rekening &
  // kategori yang benar-benar ada di database (tidak ada ID keras).
  const filteredCategories = categories.filter((c) => c.type === type)
  const effectiveCategory = category || filteredCategories[0]?.name || ""
  const effectiveAccountId = accountId || accounts[0]?.id || ""

  const onlyDigits = (raw: string) => raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "")

  const notify = (ok: boolean, message: string) => {
    setFeedback({ ok, message })
    if (ok) window.setTimeout(() => setFeedback(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numericAmount = Number.parseInt(onlyDigits(amount) || "0", 10)
    if (!description.trim()) {
      notify(false, "Isi deskripsi transaksi dulu ya.")
      return
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      notify(false, "Nominal harus angka dan lebih besar dari 0.")
      return
    }
    if (!effectiveAccountId) {
      notify(false, "Belum ada rekening aktif. Tambahkan dulu di menu Master Data.")
      return
    }

    setIsSaving(true)
    const ok = await addTransaction({
      description: description.trim(),
      amount: numericAmount,
      type,
      category: effectiveCategory || (type === "expense" ? "Lainnya" : "Pemasukan"),
      accountId: effectiveAccountId,
    })
    setIsSaving(false)

    if (ok) {
      setAmount("")
      setDescription("")
      notify(true, "Transaksi tersimpan.")
    } else {
      notify(false, "Gagal menyimpan transaksi. Coba lagi.")
    }
  }

  return (
    <>
      <section
        aria-label="Tambah transaksi cepat"
        className="rounded-2xl border border-[#3B82F6]/30 bg-[#1F2937] p-5 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Tambah Transaksi</h2>
            <p className="text-xs text-gray-400">Langsung isi di bawah ini, tanpa buka menu.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsTransferOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-gray-200 transition-colors hover:border-[#3B82F6]/50 hover:text-white"
          >
            <ArrowRightLeft className="size-4 text-[#3B82F6]" />
            Transfer Antar Rekening
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Jenis transaksi */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-[#111827] p-1.5">
            <button
              type="button"
              onClick={() => {
                setType("expense")
                setCategory("")
              }}
              aria-pressed={type === "expense"}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                type === "expense" ? "bg-[#EF4444] text-white shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowDownCircle className="size-4" />
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income")
                setCategory("")
              }}
              aria-pressed={type === "income"}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                type === "income" ? "bg-[#10B981] text-white shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowUpCircle className="size-4" />
              Pemasukan
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Nominal */}
            <div>
              <label htmlFor="qa-amount" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Nominal (Rp)
              </label>
              <input
                id="qa-amount"
                inputMode="numeric"
                required
                placeholder="Contoh: 150000"
                value={amount}
                onChange={(e) => setAmount(onlyDigits(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-lg font-bold text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="qa-desc" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Deskripsi
              </label>
              <input
                id="qa-desc"
                type="text"
                required
                placeholder="Contoh: Belanja sayur"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Kategori */}
            <div>
              <label htmlFor="qa-category" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Kategori
              </label>
              <select
                id="qa-category"
                value={effectiveCategory}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {filteredCategories.length === 0 && <option value="">Belum ada kategori</option>}
                {filteredCategories.map((cat) => (
                  <option key={`${cat.type}-${cat.name}`} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rekening */}
            <div>
              <label htmlFor="qa-account" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Rekening / Pembayaran
              </label>
              <select
                id="qa-account"
                value={effectiveAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {accounts.length === 0 && <option value="">Belum ada rekening</option>}
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Rp {acc.balance.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-[#3B82F6]/90 active:scale-[0.98] disabled:opacity-50 sm:flex-none"
            >
              <Save className="size-4" />
              {isSaving ? "Menyimpan..." : "Simpan Transaksi"}
            </button>

            {feedback && (
              <span
                role="status"
                className={`inline-flex items-center gap-2 text-xs font-semibold ${
                  feedback.ok ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {feedback.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                {feedback.message}
              </span>
            )}
          </div>
        </form>
      </section>

      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} defaultTab="accounts" />
    </>
  )
}
