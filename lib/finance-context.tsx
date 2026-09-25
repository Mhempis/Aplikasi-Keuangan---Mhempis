"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"
import { useAuth } from "./auth-context"
import {
  type Account,
  type AccountId,
  type Transaction,
  type SavingsGoal,
  type SpendingCategory,
  type CategoryItem,
  type TransactionType,
  initialAccounts,
  initialTransactions,
  initialSavingsGoals,
  initialCategories,
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
  addTransaction: (tx: Omit<Transaction, "id" | "date" | "status">) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "currentAmount">) => Promise<void>
  depositToSavings: (goalId: string, amount: number) => Promise<void>
  transferBetweenSavings: (fromGoalId: string, toGoalId: string, amount: number) => Promise<boolean>
  transferBetweenAccounts: (fromAccountId: AccountId, toAccountId: AccountId, amount: number) => Promise<boolean>
  addAccount: (name: string, initialBalance: number) => Promise<void>
  editAccount: (id: AccountId, name: string, balance: number) => Promise<void>
  deleteAccount: (id: AccountId) => Promise<void>
  addCategory: (name: string, type: TransactionType, color?: string) => Promise<void>
  deleteCategory: (name: string, type: TransactionType) => Promise<void>
  resetToDefaultData: () => Promise<void>
  refreshData: () => Promise<void>
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id || "usr_default"

  const storageKeyAccounts = `pf_dashboard_accounts_${userId}`
  const storageKeyTransactions = `pf_dashboard_transactions_${userId}`
  const storageKeySavings = `pf_dashboard_savings_${userId}`
  const storageKeyCategories = `pf_dashboard_categories_${userId}`

  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(initialSavingsGoals)
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories)
  const [isLoaded, setIsLoaded] = useState(false)

  // 1. Initial load from isolated LocalStorage per userId
  useEffect(() => {
    try {
      const savedAccounts = localStorage.getItem(storageKeyAccounts)
      const savedTx = localStorage.getItem(storageKeyTransactions)
      const savedSavings = localStorage.getItem(storageKeySavings)
      const savedCategories = localStorage.getItem(storageKeyCategories)

      if (savedAccounts) setAccounts(JSON.parse(savedAccounts))
      else setAccounts(initialAccounts)

      if (savedTx) setTransactions(JSON.parse(savedTx))
      else setTransactions(initialTransactions)

      if (savedSavings) setSavingsGoals(JSON.parse(savedSavings))
      else setSavingsGoals(initialSavingsGoals)

      if (savedCategories) setCategories(JSON.parse(savedCategories))
      else setCategories(initialCategories)
    } catch (e) {
      console.error("Failed to load local finance data:", e)
    } finally {
      setIsLoaded(true)
    }
  }, [userId, storageKeyAccounts, storageKeyTransactions, storageKeySavings, storageKeyCategories])

  // 2. Sync to isolated LocalStorage per userId on state update
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(storageKeyAccounts, JSON.stringify(accounts))
      localStorage.setItem(storageKeyTransactions, JSON.stringify(transactions))
      localStorage.setItem(storageKeySavings, JSON.stringify(savingsGoals))
      localStorage.setItem(storageKeyCategories, JSON.stringify(categories))
    } catch (e) {
      console.error("Failed to save local finance data:", e)
    }
  }, [accounts, transactions, savingsGoals, categories, isLoaded, storageKeyAccounts, storageKeyTransactions, storageKeySavings, storageKeyCategories])

  // 3. Sync from isolated SQLite API per userId
  const fetchFinanceData = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance?userId=${userId}`, {
        headers: { "x-user-id": userId },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.accounts && data.accounts.length > 0) setAccounts(data.accounts)
        if (data.transactions && data.transactions.length > 0) setTransactions(data.transactions)
        if (data.savingsGoals && data.savingsGoals.length > 0) setSavingsGoals(data.savingsGoals)
        if (data.categories && data.categories.length > 0) setCategories(data.categories)
      }
    } catch (e) {
      console.log("SQLite API fallback to user local state")
    }
  }, [userId])

  useEffect(() => {
    fetchFinanceData()
  }, [fetchFinanceData])

  // Isolated Actions with x-user-id header
  const addTransaction = async (newTxData: Omit<Transaction, "id" | "date" | "status">) => {
    const now = new Date().toISOString()
    const newTx: Transaction = {
      ...newTxData,
      id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: now,
      status: "completed",
    }

    setTransactions((prev) => [newTx, ...prev])
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newTxData.accountId) {
          const delta = newTxData.type === "income" ? newTxData.amount : -newTxData.amount
          return { ...acc, balance: Math.max(0, acc.balance + delta), updatedAt: now }
        }
        return acc
      })
    )

    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ ...newTxData, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id)
    if (!tx) return

    setTransactions((prev) => prev.filter((t) => t.id !== id))
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === tx.accountId) {
          const delta = tx.type === "income" ? -tx.amount : tx.amount
          return { ...acc, balance: Math.max(0, acc.balance + delta), updatedAt: new Date().toISOString() }
        }
        return acc
      })
    )

    try {
      await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const addSavingsGoal = async (newGoal: Omit<SavingsGoal, "id" | "currentAmount">) => {
    const goal: SavingsGoal = {
      ...newGoal,
      id: `s_${Date.now()}`,
      currentAmount: 0,
    }
    setSavingsGoals((prev) => [...prev, goal])

    try {
      await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ ...newGoal, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const depositToSavings = async (goalId: string, amount: number) => {
    const goal = savingsGoals.find((g) => g.id === goalId)
    if (!goal || amount <= 0) return

    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g))
    )

    await addTransaction({
      description: `Setoran Tabungan: ${goal.name}`,
      category: "Investasi & Dividen",
      amount,
      type: "expense",
      accountId: goal.accountId,
    })

    try {
      await fetch("/api/savings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ type: "deposit", goalId, amount, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const transferBetweenSavings = async (fromGoalId: string, toGoalId: string, amount: number): Promise<boolean> => {
    if (fromGoalId === toGoalId || amount <= 0) return false
    const fromGoal = savingsGoals.find((g) => g.id === fromGoalId)
    const toGoal = savingsGoals.find((g) => g.id === toGoalId)

    if (!fromGoal || !toGoal) return false
    if (fromGoal.currentAmount < amount) return false

    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === fromGoalId) return { ...g, currentAmount: g.currentAmount - amount }
        if (g.id === toGoalId) return { ...g, currentAmount: g.currentAmount + amount }
        return g
      })
    )

    try {
      await fetch("/api/savings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ type: "transfer", fromGoalId, toGoalId, amount, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }

    return true
  }

  const transferBetweenAccounts = async (fromAccountId: AccountId, toAccountId: AccountId, amount: number): Promise<boolean> => {
    if (fromAccountId === toAccountId || amount <= 0) return false
    const fromAcc = accounts.find((a) => a.id === fromAccountId)
    const toAcc = accounts.find((a) => a.id === toAccountId)

    if (!fromAcc || !toAcc) return false
    if (fromAcc.balance < amount) return false

    const now = new Date().toISOString()
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount, updatedAt: now }
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount, updatedAt: now }
        return acc
      })
    )

    try {
      await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ fromAccountId, toAccountId, amount, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }

    return true
  }

  const addAccount = async (name: string, initialBalance: number) => {
    const id = `acc_${Date.now()}_${userId}`
    const newAcc: Account = {
      id,
      name,
      balance: Math.max(0, initialBalance),
      updatedAt: new Date().toISOString(),
    }
    setAccounts((prev) => [...prev, newAcc])

    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name, balance: initialBalance, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const editAccount = async (id: AccountId, name: string, balance: number) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, name, balance: Math.max(0, balance), updatedAt: new Date().toISOString() } : acc))
    )

    try {
      await fetch("/api/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ id, name, balance, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const deleteAccount = async (id: AccountId) => {
    if (accounts.length <= 1) {
      alert("Tidak bisa menghapus semua rekening! Minimal harus ada 1 rekening aktif.")
      return
    }
    setAccounts((prev) => prev.filter((acc) => acc.id !== id))

    try {
      await fetch(`/api/accounts?id=${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const addCategory = async (name: string, type: TransactionType, color: string = "#3B82F6") => {
    const exists = categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.type === type)
    if (exists) {
      alert("Kategori dengan nama ini sudah ada!")
      return
    }
    setCategories((prev) => [...prev, { name, type, color }])

    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ name, type, color, userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const deleteCategory = async (name: string, type: TransactionType) => {
    setCategories((prev) => prev.filter((c) => !(c.name === name && c.type === type)))

    try {
      await fetch(`/api/categories?name=${encodeURIComponent(name)}&type=${type}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const resetToDefaultData = async () => {
    setAccounts(initialAccounts)
    setTransactions(initialTransactions)
    setSavingsGoals(initialSavingsGoals)
    setCategories(initialCategories)
    try {
      localStorage.removeItem(storageKeyAccounts)
      localStorage.removeItem(storageKeyTransactions)
      localStorage.removeItem(storageKeySavings)
      localStorage.removeItem(storageKeyCategories)
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ action: "reset", userId }),
      })
    } catch (e) {
      console.log("Background API sync error:", e)
    }
  }

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts])

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const totalSavings = useMemo(() => savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0), [savingsGoals])

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
        refreshData: fetchFinanceData,
      }}
    >
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
