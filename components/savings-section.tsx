"use client"

import { useState } from "react"
import { PiggyBank, Plus, TrendingUp, X, ArrowRightLeft } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, type AccountId } from "@/lib/finance-data"
import { TransferModal } from "./transfer-modal"

export function SavingsSection() {
  const { savingsGoals, accounts, addSavingsGoal, depositToSavings } = useFinance()
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)

  // Add Goal Form State
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [category, setCategory] = useState("Pendidikan")
  const [accountId, setAccountId] = useState<string>("")
  const [targetDate, setTargetDate] = useState("")

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState("")

  // Nilai efektif: pakai rekening yang benar-benar ada di database, bukan ID keras "bca".
  const effectiveAccountId = accountId || accounts[0]?.id || ""

  const activeDepositGoal = savingsGoals.find((g) => g.id === depositGoalId)

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const numTarget = parseFloat(targetAmount.replace(/[^0-9]/g, ""))
    if (!name.trim() || isNaN(numTarget) || numTarget <= 0) {
      alert("Harap isi nama target dan nominal yang valid!")
      return
    }
    if (!effectiveAccountId) {
      alert("Belum ada rekening aktif. Tambahkan rekening dulu di menu Master Data.")
      return
    }

    addSavingsGoal({
      name,
      targetAmount: numTarget,
      category,
      color: "#3B82F6",
      accountId: effectiveAccountId,
      targetDate: targetDate || undefined,
    })

    setName("")
    setTargetAmount("")
    setIsAddGoalOpen(false)
  }

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositGoalId) return
    const numDeposit = parseFloat(depositAmount.replace(/[^0-9]/g, ""))
    if (isNaN(numDeposit) || numDeposit <= 0) {
      alert("Harap isi nominal setoran yang valid!")
      return
    }

    depositToSavings(depositGoalId, numDeposit)
    setDepositAmount("")
    setDepositGoalId(null)
  }

  return (
    <section aria-label="Target Tabungan" className="rounded-xl border border-white/5 bg-[#1F2937] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <PiggyBank className="size-5 text-[#10B981]" />
            Target Tabungan Rumah Tangga
          </h2>
          <p className="text-xs text-gray-400">Impian & Alokasi Dana Tabungan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowRightLeft className="size-3.5 text-[#3B82F6]" />
            Transfer Tabungan
          </button>
          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981]/15 px-3 py-1.5 text-xs font-semibold text-[#10B981] hover:bg-[#10B981]/25 transition-colors"
          >
            <Plus className="size-4" />
            Tambah Target
          </button>
        </div>
      </div>

      {/* Savings Goals Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {savingsGoals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0
          return (
            <div
              key={goal.id}
              className="flex flex-col justify-between rounded-xl border border-white/5 bg-[#111827] p-4 transition-all hover:border-[#10B981]/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                    {goal.category}
                  </span>
                  <span className="text-xs font-bold text-[#10B981]">{progress}%</span>
                </div>
                <h3 className="mt-2 text-base font-bold text-white">{goal.name}</h3>
                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <span className="text-gray-400">Terkumpul:</span>
                  <span className="font-semibold text-[#10B981]">{formatCurrency(goal.currentAmount)}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-xs">
                  <span className="text-gray-400">Target:</span>
                  <span className="font-medium text-gray-200">{formatCurrency(goal.targetAmount)}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#10B981] to-[#3B82F6] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {goal.targetDate ? `Target: ${new Date(goal.targetDate).toLocaleDateString("id-ID")}` : "Tanpa Batas"}
                </span>
                <button
                  onClick={() => setDepositGoalId(goal.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-[#3B82F6] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#3B82F6]/90 transition-colors"
                >
                  <TrendingUp className="size-3" />
                  Setor
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Add Savings Goal */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1F2937] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Buat Target Tabungan Baru</h3>
              <button onClick={() => setIsAddGoalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Nama Tabungan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Pendidikan Anak"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 20000000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#10B981] focus:outline-none"
                >
                  <option value="Pendidikan">Pendidikan</option>
                  <option value="Keamanan">Keamanan / Dana Darurat</option>
                  <option value="Rekreasi">Rekreasi / Liburan</option>
                  <option value="Properti">Properti / Rumah</option>
                  <option value="Kendaraan">Kendaraan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Sumber Akun Utama</label>
                <select
                  value={effectiveAccountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#10B981] focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Target Tanggal (Opsional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#10B981] py-3 text-sm font-bold text-white hover:bg-[#10B981]/90"
                >
                  Simpan Target Tabungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Deposit */}
      {depositGoalId && activeDepositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1F2937] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Setor Tabungan: {activeDepositGoal.name}</h3>
              <button onClick={() => setDepositGoalId(null)} className="text-gray-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-gray-400">
                  Target: <span className="font-semibold text-white">{formatCurrency(activeDepositGoal.targetAmount)}</span> |
                  Terkumpul: <span className="font-semibold text-[#10B981]">{formatCurrency(activeDepositGoal.currentAmount)}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Nominal Setoran (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 500000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-lg font-semibold text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-bold text-white hover:bg-[#3B82F6]/90"
                >
                  Konfirmasi Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        defaultTab="savings"
      />
    </section>
  )
}
