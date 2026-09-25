"use client"

import { Landmark, Wallet, Smartphone, Banknote } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { useVisibility } from "@/lib/visibility-context"
import { formatCurrency, formatRelative, type AccountId } from "@/lib/finance-data"

const icons: Record<AccountId, typeof Landmark> = {
  bca: Landmark,
  mandiri: Wallet,
  ovo: Smartphone,
  cash: Banknote,
}

export function BalanceCards() {
  const { accounts } = useFinance()
  const { isAmountVisible } = useVisibility()

  const formatAmount = (amount: number) => {
    if (!isAmountVisible) return "••••••"
    return formatCurrency(amount)
  }

  return (
    <section aria-label="Saldo akun" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {accounts.map((account) => {
        const Icon = icons[account.id] || Landmark
        return (
          <article
            key={account.id}
            className="rounded-xl border border-white/5 bg-[#1F2937] p-5 shadow-sm transition-all hover:border-[#3B82F6]/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">{account.name}</h3>
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-[#10B981]">{formatAmount(account.balance)}</p>
            <p className="mt-1 text-xs text-gray-400">Diperbarui {formatRelative(account.updatedAt)}</p>
          </article>
        )
      })}
    </section>
  )
}
