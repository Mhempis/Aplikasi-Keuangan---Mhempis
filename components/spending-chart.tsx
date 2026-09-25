"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, type SpendingCategory } from "@/lib/finance-data"

function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: Array<{ payload: SpendingCategory }>
  total: number
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0"
  return (
    <div className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-white">{item.category}</p>
      <p className="text-[#EF4444] font-bold">{formatCurrency(item.amount)}</p>
      <p className="text-xs text-gray-400">{pct}% dari pengeluaran</p>
    </div>
  )
}

export function SpendingChart() {
  const { spendingByCategory } = useFinance()
  const total = spendingByCategory.reduce((sum, c) => sum + c.amount, 0)

  return (
    <section
      aria-label="Pengeluaran bulanan per kategori"
      className="rounded-xl border border-white/5 bg-[#1F2937] p-5 shadow-sm h-full flex flex-col justify-between"
    >
      <div>
        <h2 className="text-lg font-bold text-white">Analisis Pengeluaran</h2>
        <p className="text-xs text-gray-400">Berdasarkan kategori transaksi</p>
      </div>

      {spendingByCategory.length === 0 ? (
        <div className="my-8 text-center text-xs text-gray-400">Belum ada pengeluaran dicatat.</div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={48}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                >
                  {spendingByCategory.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="w-full space-y-2 max-h-48 overflow-y-auto pr-1">
            {spendingByCategory.map((item) => {
              const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0"
              return (
                <li key={item.category} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 text-gray-300">
                    <span className="size-3 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <span className="font-medium">{item.category}</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-white">{pct}%</span>
                    <span className="ml-2 text-[10px] text-gray-400">({formatCurrency(item.amount)})</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
