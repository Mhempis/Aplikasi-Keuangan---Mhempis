"use client"

import { Wallet, TrendingUp, TrendingDown } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { useVisibility } from "@/lib/visibility-context"
import { formatCurrency } from "@/lib/finance-data"

const cards = [
  { key: "net", label: "Kekayaan Bersih", icon: Wallet, tone: "text-[#3B82F6]", bg: "bg-[#3B82F6]/15" },
  { key: "income", label: "Pemasukan", icon: TrendingUp, tone: "text-[#10B981]", bg: "bg-[#10B981]/15" },
  { key: "expense", label: "Pengeluaran", icon: TrendingDown, tone: "text-[#EF4444]", bg: "bg-[#EF4444]/15" },
] as const

/** Ringkasan angka ringkas — 3 kartu kecil dalam satu baris. */
export function SummaryStats() {
  const { totalBalance, totalIncome, totalExpense } = useFinance()
  const { isAmountVisible } = useVisibility()

  const values: Record<(typeof cards)[number]["key"], number> = {
    net: totalBalance,
    income: totalIncome,
    expense: totalExpense,
  }

  const formatAmount = (amount: number) => {
    if (!isAmountVisible) return "••••••"
    return formatCurrency(amount)
  }

  return (
    <section aria-label="Ringkasan keuangan" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article
            key={card.key}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#1F2937] p-3.5 shadow-sm"
          >
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.bg} ${card.tone}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-gray-400">{card.label}</p>
              <p className={`truncate text-base font-bold ${card.tone}`}>{formatAmount(values[card.key])}</p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
