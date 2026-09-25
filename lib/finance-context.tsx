"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "./auth-context"
import {
  type Account,
  type AccountId,
  type Transaction,
  type SavingsGoal,
  type SpendingCategory,
  type CategoryItem,
  type TransactionType,
  CATEGORY_COLORS,
} from "./finance-data"

interface FinanceContextType {
  accounts: Account[]
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
  categories: CategoryItem[]
  spendingByCategory: SpendingCategory[]
  totalBalance: number
  totalIncome: number
  totalExpense: number
  totalSavings: number
  addTransaction: (tx: Omit<Transaction, "id" | "date" | "status">) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "currentAmount">) => Promise<boolean>
  depositToSavings: (goalId: string, amount: number) => Promise<boolean>
  transferBetweenSavings: (fromGoalId: string, toGoalId: string, amount: number) => Promise<boolean>
  transferBetweenAccounts: (fromAccountId: AccountId, toAccountId: AccountId, amount: number) => Promise<boolean>
  addAccount: (name: string, initialBalance: number) => Promise<boolean>
  editAccount: (id: AccountId, name: string, balance: number) => Promise<boolean>
  deleteAccount: (id: AccountId) => Promise<boolean>
  addCategory: (name: string, type: TransactionType, color?: string) => Promise<boolean>
  deleteCategory: (name: string, type: TransactionType) => Promise<boolean>
  resetToDefaultData: () => Promise<boolean>
  refreshData: () => Promise<void>
}

interface Snapshot {
  accounts: Account[]
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
  categories: CategoryItem[]
}

const EMPTY: Snapshot = { accounts: [], transactions: [], savingsGoals: [], categories: [] }

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

/**
 * Sumber kebenaran data keuangan = DATABASE (lewat API ber-sesi).
 * localStorage TIDAK lagi dipakai sebagai penyimpanan utama, jadi:
 *  - data tidak bisa dipalsukan dari browser,
 *  - data tidak hilang saat ganti perangkat/clear browser,
 *  - tiap user hanya melihat datanya sendiri (userId dari sesi server).
 *
 * Pola update: optimistik dulu (UI responsif) -> kirim ke server ->
 * kalau server menolak, state dikembalikan (rollback) + pesan error.
 */
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [data, setData] = useState<Snapshot>(EMPTY)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const dataRef = useRef<Snapshot>(EMPTY)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const refreshData = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch("/api/finance", { cache: "no-store" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (!res.ok) {
        setErrorMessage("Gagal memuat data keuangan dari server.")
        return
      }
      const payload = (await res.json()) as Partial<Snapshot>
      setData({
        accounts: payload.accounts ?? [],
        transactions: payload.transactions ?? [],
        savingsGoals: payload.savingsGoals ?? [],
        categories: payload.categories ?? [],
      })
      setErrorMessage(null)
    } catch {
      setErrorMessage("Tidak bisa menghubungi server. Perubahan tidak akan tersimpan.")
    }
  }, [userId])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const apiCall = useCallback(async (url: string, init: RequestInit) => {
    const res = await fetch(url, { ...init, cache: "no-store" })
    const payload = (await res.json().catch(() => ({}))) as { error?: string }

    if (res.status === 401) {
      window.location.href = "/login"
      throw new Error("Sesi berakhir. Silakan masuk kembali.")
    }
    if (!res.ok) {
      throw new Error(payload.error || "Permintaan gagal diproses server.")
    }
    return payload
  }, [])

  const runMutation = useCallback(
    async (updater: (current: Snapshot) => Snapshot, request: () => Promise<unknown>): Promise<boolean> => {
      const previous = dataRef.current
      setData(updater(previous))

      try {
        await request()
        await refreshData()
        return true
      } catch (error) {
        setData(previous) // rollback supaya UI tidak "sukses palsu"
        setErrorMessage(error instanceof Error ? error.message : "Terjadi kesalahan.")
        return false
      }
    },
    [refreshData]
  )

  const jsonPost = (url: string, body: unknown, method = "POST"): Promise<unknown> =>
    apiCall(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

  /* ------------------------- mutasi ------------------------- */

  const addTransaction = (newTxData: Omit<Transaction, "id" | "date" | "status">) => {
    const nowIso = new Date().toISOString()
    return runMutation(
      (current) => ({
        ...current,
        transactions: [
          { ...newTxData, id: `tmp_${Date.now()}`, date: nowIso, status: "completed" as const },
          ...current.transactions,
        ],
        accounts: current.accounts.map((acc) =>
          acc.id === newTxData.accountId
            ? {
                ...acc,
                balance:
                  acc.balance + (newTxData.type === "income" ? newTxData.amount : -newTxData.amount),
                updatedAt: nowIso,
              }
            : acc
        ),
      }),
      () => jsonPost("/api/transactions", newTxData)
    )
  }

  const deleteTransaction = (id: string) =>
    runMutation(
      (current) => {
        const tx = current.transactions.find((t) => t.id === id)
        if (!tx) return current
        return {
          ...current,
          transactions: current.transactions.filter((t) => t.id !== id),
          accounts: current.accounts.map((acc) =>
            acc.id === tx.accountId
              ? {
                  ...acc,
                  balance: acc.balance + (tx.type === "income" ? -tx.amount : tx.amount),
                  updatedAt: new Date().toISOString(),
                }
              : acc
          ),
        }
      },
      () => apiCall(`/api/transactions?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    )

  const addSavingsGoal = (newGoal: Omit<SavingsGoal, "id" | "currentAmount">) =>
    runMutation(
      (current) => ({
        ...current,
        savingsGoals: [
          ...current.savingsGoals,
          { ...newGoal, id: `tmp_${Date.now()}`, currentAmount: 0 },
        ],
      }),
      () => jsonPost("/api/savings", newGoal)
    )

  const depositToSavings = (goalId: string, amount: number) => {
    if (amount <= 0) return Promise.resolve(false)
    return runMutation(
      (current) => ({
        ...current,
        savingsGoals: current.savingsGoals.map((g) =>
          g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
        ),
      }),
      () => jsonPost("/api/savings", { type: "deposit", goalId, amount }, "PUT")
    )
  }

  const transferBetweenSavings = (fromGoalId: string, toGoalId: string, amount: number) => {
    if (fromGoalId === toGoalId || amount <= 0) return Promise.resolve(false)

    const fromGoal = dataRef.current.savingsGoals.find((g) => g.id === fromGoalId)
    if (!fromGoal || fromGoal.currentAmount < amount) {
      setErrorMessage("Dana pada target tabungan sumber tidak cukup.")
      return Promise.resolve(false)
    }

    return runMutation(
      (current) => ({
        ...current,
        savingsGoals: current.savingsGoals.map((g) => {
          if (g.id === fromGoalId) return { ...g, currentAmount: g.currentAmount - amount }
          if (g.id === toGoalId) return { ...g, currentAmount: g.currentAmount + amount }
          return g
        }),
      }),
      () => jsonPost("/api/savings", { type: "transfer", fromGoalId, toGoalId, amount }, "PUT")
    )
  }

  const transferBetweenAccounts = (fromAccountId: AccountId, toAccountId: AccountId, amount: number) => {
    if (fromAccountId === toAccountId || amount <= 0) return Promise.resolve(false)

    const fromAcc = dataRef.current.accounts.find((a) => a.id === fromAccountId)
    if (!fromAcc || fromAcc.balance < amount) {
      setErrorMessage("Saldo rekening sumber tidak cukup.")
      return Promise.resolve(false)
    }

    const nowIso = new Date().toISOString()
    return runMutation(
      (current) => ({
        ...current,
        accounts: current.accounts.map((acc) => {
          if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount, updatedAt: nowIso }
          if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount, updatedAt: nowIso }
          return acc
        }),
      }),
      () => jsonPost("/api/accounts", { fromAccountId, toAccountId, amount }, "PATCH")
    )
  }

  const addAccount = (name: string, initialBalance: number) =>
    runMutation(
      (current) => ({
        ...current,
        accounts: [
          ...current.accounts,
          {
            id: `tmp_${Date.now()}`,
            name,
            balance: initialBalance,
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
      () => jsonPost("/api/accounts", { name, balance: initialBalance })
    )

  const editAccount = (id: AccountId, name: string, balance: number) =>
    runMutation(
      (current) => ({
        ...current,
        accounts: current.accounts.map((acc) =>
          acc.id === id ? { ...acc, name, balance, updatedAt: new Date().toISOString() } : acc
        ),
      }),
      () => jsonPost("/api/accounts", { id, name, balance }, "PUT")
    )

  const deleteAccount = (id: AccountId) => {
    if (dataRef.current.accounts.length <= 1) {
      setErrorMessage("Tidak bisa menghapus semua rekening. Minimal harus ada 1 rekening aktif.")
      return Promise.resolve(false)
    }
    return runMutation(
      (current) => ({ ...current, accounts: current.accounts.filter((acc) => acc.id !== id) }),
      () => apiCall(`/api/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    )
  }

  const addCategory = (name: string, type: TransactionType, color = "#3B82F6") => {
    const exists = dataRef.current.categories.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.type === type
    )
    if (exists) {
      setErrorMessage("Kategori dengan nama ini sudah ada.")
      return Promise.resolve(false)
    }

    return runMutation(
      (current) => ({ ...current, categories: [...current.categories, { name, type, color }] }),
      () => jsonPost("/api/categories", { name, type, color })
    )
  }

  const deleteCategory = (name: string, type: TransactionType) =>
    runMutation(
      (current) => ({
        ...current,
        categories: current.categories.filter((c) => !(c.name === name && c.type === type)),
      }),
      () =>
        apiCall(`/api/categories?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
          method: "DELETE",
        })
    )

  const resetToDefaultData = () =>
    runMutation((current) => current, () => jsonPost("/api/finance", { action: "reset" }))

  /* ------------------------- turunan ------------------------- */

  const { accounts, transactions, savingsGoals, categories } = data

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts])

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense" && t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalSavings = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0),
    [savingsGoals]
  )

  const spendingByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    transactions
      .filter((t) => t.type === "expense" && t.status === "completed")
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
      })

    const result: SpendingCategory[] = Object.entries(categoryTotals).map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      color: CATEGORY_COLORS[cat] || "#9CA3AF",
    }))

    return result.sort((a, b) => b.amount - a.amount)
  }, [transactions])

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        savingsGoals,
        categories,
        spendingByCategory,
        totalBalance,
        totalIncome,
        totalExpense,
        totalSavings,
        addTransaction,
        deleteTransaction,
        addSavingsGoal,
        depositToSavings,
        transferBetweenSavings,
        transferBetweenAccounts,
        addAccount,
        editAccount,
        deleteAccount,
        addCategory,
        deleteCategory,
        resetToDefaultData,
        refreshData,
      }}
    >
      {errorMessage && (
        <div className="fixed inset-x-0 top-0 z-50 bg-[#EF4444] px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
          {errorMessage}
        </div>
      )}
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider")
  }
  return context
}
