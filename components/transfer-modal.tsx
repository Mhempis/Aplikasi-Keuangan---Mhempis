"use client"

import { useState } from "react"
import { X, ArrowRightLeft, PiggyBank, Landmark } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, type AccountId } from "@/lib/finance-data"

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "savings" | "accounts"
}

export function TransferModal({ isOpen, onClose, defaultTab = "savings" }: TransferModalProps) {
  const { savingsGoals, accounts, transferBetweenSavings, transferBetweenAccounts } = useFinance()
  const [tab, setTab] = useState<"savings" | "accounts">(defaultTab)

  // Savings Transfer State
  const [fromGoalId, setFromGoalId] = useState<string>(savingsGoals[0]?.id || "")
  const [toGoalId, setToGoalId] = useState<string>(savingsGoals[1]?.id || "")
  const [savingsAmount, setSavingsAmount] = useState<string>("")

  // Account Transfer State
  const [fromAccountId, setFromAccountId] = useState<AccountId>(accounts[0]?.id || "bca")
  const [toAccountId, setToAccountId] = useState<AccountId>(accounts[1]?.id || "mandiri")
  const [accountAmount, setAccountAmount] = useState<string>("")

  if (!isOpen) return null

  const handleSavingsTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(savingsAmount.replace(/[^0-9]/g, ""))
    if (isNaN(amt) || amt <= 0) {
      alert("Harap masukkan nominal transfer yang valid!")
      return
    }
    if (fromGoalId === toGoalId) {
      alert("Tabungan asal dan tujuan tidak boleh sama!")
      return
    }

    const fromGoal = savingsGoals.find((g) => g.id === fromGoalId)
    if (!fromGoal || fromGoal.currentAmount < amt) {
      alert(`Saldo Tabungan Asal tidak mencukupi! (Tersedia: ${formatCurrency(fromGoal?.currentAmount || 0)})`)
      return
    }

    const success = await transferBetweenSavings(fromGoalId, toGoalId, amt)
    if (success) {
      setSavingsAmount("")
      onClose()
    } else {
      alert("Transfer antar tabungan gagal. Periksa kembali saldo & pilihan tabungan.")
    }
  }

  const handleAccountTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(accountAmount.replace(/[^0-9]/g, ""))
    if (isNaN(amt) || amt <= 0) {
      alert("Harap masukkan nominal transfer yang valid!")
      return
    }
    if (fromAccountId === toAccountId) {
      alert("Akun asal dan tujuan tidak boleh sama!")
      return
    }

    const fromAcc = accounts.find((a) => a.id === fromAccountId)
    if (!fromAcc || fromAcc.balance < amt) {
      alert(`Saldo Akun Asal tidak mencukupi! (Tersedia: ${formatCurrency(fromAcc?.balance || 0)})`)
      return
    }

    const success = await transferBetweenAccounts(fromAccountId, toAccountId, amt)
    if (success) {
      setAccountAmount("")
      onClose()
    } else {
      alert("Transfer antar akun gagal. Periksa kembali saldo & pilihan akun.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1F2937] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="size-5 text-[#3B82F6]" />
            Menu Transfer Funds
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#111827] p-1.5 border border-white/5">
          <button
            type="button"
            onClick={() => setTab("savings")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              tab === "savings"
                ? "bg-[#3B82F6] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <PiggyBank className="size-4" />
            Antar Tabungan
          </button>
          <button
            type="button"
            onClick={() => setTab("accounts")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              tab === "accounts"
                ? "bg-[#3B82F6] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Landmark className="size-4" />
            Antar Rekening/Akun
          </button>
        </div>

        {/* Form Transfer Antar Tabungan */}
        {tab === "savings" && (
          <form onSubmit={handleSavingsTransfer} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Dari Tabungan (Asal)
              </label>
              <select
                value={fromGoalId}
                onChange={(e) => setFromGoalId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {savingsGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Terkumpul: {formatCurrency(g.currentAmount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center -my-1">
              <span className="rounded-full bg-[#3B82F6]/20 p-2 text-[#3B82F6]">
                <ArrowRightLeft className="size-4 rotate-90" />
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Ke Tabungan (Tujuan)
              </label>
              <select
                value={toGoalId}
                onChange={(e) => setToGoalId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {savingsGoals
                  .filter((g) => g.id !== fromGoalId)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Terkumpul: {formatCurrency(g.currentAmount)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Nominal Transfer (Rp)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Contoh: 500000"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-lg font-semibold text-white focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-[#3B82F6]/90 active:scale-[0.98]"
              >
                Transfer Antar Tabungan
              </button>
            </div>
          </form>
        )}

        {/* Form Transfer Antar Rekening */}
        {tab === "accounts" && (
          <form onSubmit={handleAccountTransfer} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Dari Rekening (Asal)
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value as AccountId)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Saldo: {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center -my-1">
              <span className="rounded-full bg-[#3B82F6]/20 p-2 text-[#3B82F6]">
                <ArrowRightLeft className="size-4 rotate-90" />
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Ke Rekening (Tujuan)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value as AccountId)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {accounts
                  .filter((acc) => acc.id !== fromAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo: {formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Nominal Transfer (Rp)
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Contoh: 1000000"
                value={accountAmount}
                onChange={(e) => setAccountAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-lg font-semibold text-white focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-[#3B82F6]/90 active:scale-[0.98]"
              >
                Transfer Antar Rekening
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
