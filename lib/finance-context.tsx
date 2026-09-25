"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react"
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
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(initialSavingsGoals)
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories)

  const fetchFinanceData = useCallback(async () => {
    try {
      const res = await fetch("/api/finance")
      if (res.ok) {
        const data = await res.json()
        if (data.accounts) setAccounts(data.accounts)
        if (data.transactions) setTransactions(data.transactions)
        if (data.savingsGoals) setSavingsGoals(data.savingsGoals)
        if (data.categories && data.categories.length > 0) setCategories(data.categories)
      }
    } catch (e) {
      console.error("Failed to fetch SQLite finance data:", e)
    }
  }, [])

  useEffect(() => {
    fetchFinanceData()
  }, [fetchFinanceData])

  const addTransaction = async (newTxData: Omit<Transaction, "id" | "date" | "status">) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTxData),
      })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error adding transaction:", e)
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error deleting transaction:", e)
    }
  }

  const addSavingsGoal = async (newGoal: Omit<SavingsGoal, "id" | "currentAmount">) => {
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGoal),
      })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error adding savings goal:", e)
    }
  }

  const depositToSavings = async (goalId: string, amount: number) => {
    try {
      const res = await fetch("/api/savings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "deposit", goalId, amount }),
      })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error depositing to savings:", e)
    }
  }

  const transferBetweenSavings = async (fromGoalId: string, toGoalId: string, amount: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/savings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "transfer", fromGoalId, toGoalId, amount }),
      })
      if (res.ok) {
        await fetchFinanceData()
        return true
      }
      return false
    } catch (e) {
      console.error("Error transferring savings:", e)
      return false
    }
  }

  const transferBetweenAccounts = async (fromAccountId: AccountId, toAccountId: AccountId, amount: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAccountId, toAccountId, amount }),
      })
      if (res.ok) {
        await fetchFinanceData()
        return true
      }
      return false
    } catch (e) {
      console.error("Error transferring accounts:", e)
      return false
    }
  }

  const addAccount = async (name: string, initialBalance: number) => {
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, balance: initialBalance }),
      })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error adding account:", e)
    }
  }

  const editAccount = async (id: AccountId, name: string, balance: number) => {
    try {
      const res = await fetch("/api/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, balance }),
      })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error editing account:", e)
    }
  }

  const deleteAccount = async (id: AccountId) => {
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error deleting account:", e)
    }
  }

  const addCategory = async (name: string, type: TransactionType, color: string = "#3B82F6") => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, color }),
      })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error adding category:", e)
    }
  }

  const deleteCategory = async (name: string, type: TransactionType) => {
    try {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(name)}&type=${type}`, { method: "DELETE" })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error deleting category:", e)
    }
  }

  const resetToDefaultData = async () => {
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      })
      if (res.ok) {
        await fetchFinanceData()
      }
    } catch (e) {
      console.error("Error resetting database:", e)
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
