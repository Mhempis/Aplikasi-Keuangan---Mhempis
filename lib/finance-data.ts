export type AccountId = string

export interface Account {
  id: AccountId
  name: string
  balance: number
  updatedAt: string
}

export type TransactionType = "income" | "expense"
export type TransactionStatus = "completed" | "pending" | "failed"

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  accountId: AccountId
}

export interface SpendingCategory {
  category: string
  amount: number
  color: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  category: string
  color: string
  accountId: AccountId
}

export interface CategoryItem {
  name: string
  type: TransactionType
  color: string
}

export const initialCategories: CategoryItem[] = [
  { name: "Groceries", type: "expense", color: "#3B82F6" },
  { name: "Food & Drink", type: "expense", color: "#10B981" },
  { name: "Transport", type: "expense", color: "#F59E0B" },
  { name: "Subscriptions", type: "expense", color: "#8B5CF6" },
  { name: "Shopping", type: "expense", color: "#EF4444" },
  { name: "Tagihan & Utilities", type: "expense", color: "#EC4899" },
  { name: "Pendidikan", type: "expense", color: "#06B6D4" },
  { name: "Kesehatan", type: "expense", color: "#14B8A6" },
  { name: "Cicilan & Hutang", type: "expense", color: "#F43F5E" },
  { name: "Lainnya", type: "expense", color: "#6B7280" },
  { name: "Gaji", type: "income", color: "#10B981" },
  { name: "Bonus & TFR", type: "income", color: "#3B82F6" },
  { name: "Investasi & Dividen", type: "income", color: "#8B5CF6" },
  { name: "Usaha / Sampingan", type: "income", color: "#F59E0B" },
]

export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "#3B82F6",
  "Food & Drink": "#10B981",
  Transport: "#F59E0B",
  Subscriptions: "#8B5CF6",
  Shopping: "#EF4444",
  Gaji: "#10B981",
  Investasi: "#06B6D4",
  Tagihan: "#EC4899",
  Lainnya: "#6B7280",
}

export const user = {
  name: "Budi & Keluarga",
}

export const initialAccounts: Account[] = [
  { id: "bca", name: "BCA Utama", balance: 24_750_000, updatedAt: "2026-09-24T08:14:00" },
  { id: "mandiri", name: "Mandiri Tabungan", balance: 12_320_500, updatedAt: "2026-09-24T07:52:00" },
  { id: "ovo", name: "OVO E-Wallet", balance: 1_845_000, updatedAt: "2026-09-23T21:30:00" },
  { id: "cash", name: "Dompet Tunai", balance: 640_000, updatedAt: "2026-09-22T18:05:00" },
]

export const initialTransactions: Transaction[] = [
  {
    id: "t1",
    date: "2026-09-24T08:10:00",
    description: "Gaji Bulanan",
    category: "Gaji",
    amount: 18_500_000,
    type: "income",
    status: "completed",
    accountId: "bca",
  },
  {
    id: "t2",
    date: "2026-09-23T19:42:00",
    description: "Belanja Bulanan Supermarket",
    category: "Groceries",
    amount: 1_240_000,
    type: "expense",
    status: "completed",
    accountId: "bca",
  },
  {
    id: "t3",
    date: "2026-09-23T12:15:00",
    description: "Grabcar & Ojol Harian",
    category: "Transport",
    amount: 148_000,
    type: "expense",
    status: "completed",
    accountId: "ovo",
  },
  {
    id: "t4",
    date: "2026-09-22T20:05:00",
    description: "Langganan Internet & Netflix",
    category: "Subscriptions",
    amount: 450_000,
    type: "expense",
    status: "completed",
    accountId: "mandiri",
  },
  {
    id: "t5",
    date: "2026-09-22T13:30:00",
    description: "Makan Siang Keluarga",
    category: "Food & Drink",
    amount: 292_500,
    type: "expense",
    status: "completed",
    accountId: "ovo",
  },
]

export const initialSavingsGoals: SavingsGoal[] = [
  {
    id: "s1",
    name: "Dana Darurat Keluarga",
    targetAmount: 50_000_000,
    currentAmount: 25_000_000,
    targetDate: "2026-12-31",
    category: "Keamanan",
    color: "#3B82F6",
    accountId: "bca",
  },
  {
    id: "s2",
    name: "Liburan Akhir Tahun",
    targetAmount: 15_000_000,
    currentAmount: 9_500_000,
    targetDate: "2026-11-30",
    category: "Rekreasi",
    color: "#10B981",
    accountId: "mandiri",
  },
  {
    id: "s3",
    name: "Renovasi Rumah & Dapur",
    targetAmount: 30_000_000,
    currentAmount: 8_200_000,
    targetDate: "2027-03-31",
    category: "Properti",
    color: "#F59E0B",
    accountId: "bca",
  },
]

export const accounts = initialAccounts
export const transactions = initialTransactions

export function formatCurrency(amount: number): string {
  const num = Math.round(amount || 0).toLocaleString("id-ID")
  return `Rp ${num}`
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export function formatRelative(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMin = Math.round(diffMs / 60000)
    if (diffMin < 1) return "Baru saja"
    if (diffMin < 60) return `${diffMin} menit lalu`
    const diffHr = Math.round(diffMin / 60)
    if (diffHr < 24) return `${diffHr} jam lalu`
    const diffDay = Math.round(diffHr / 24)
    return `${diffDay} hari lalu`
  } catch {
    return "Baru saja"
  }
}
