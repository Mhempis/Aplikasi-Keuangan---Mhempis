"use client"

import { useState } from "react"
import { X, Settings, Plus, Trash2, Edit2, Landmark, Tag } from "lucide-react"
import { useFinance } from "@/lib/finance-context"
import { formatCurrency, type AccountId, type TransactionType } from "@/lib/finance-data"

interface MasterDataModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MasterDataModal({ isOpen, onClose }: MasterDataModalProps) {
  const { accounts, categories, addAccount, editAccount, deleteAccount, addCategory, deleteCategory } = useFinance()
  const [activeTab, setActiveTab] = useState<"accounts" | "categories">("accounts")

  // Add Account Form State
  const [newAccName, setNewAccName] = useState("")
  const [newAccBalance, setNewAccBalance] = useState("")

  // Edit Account State
  const [editingAccId, setEditingAccId] = useState<AccountId | null>(null)
  const [editAccName, setEditAccName] = useState("")
  const [editAccBalance, setEditAccBalance] = useState("")

  // Add Category Form State
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<TransactionType>("expense")
  const [newCatColor, setNewCatColor] = useState("#3B82F6")

  if (!isOpen) return null

  // Handle Add Account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccName.trim()) {
      alert("Harap masukkan nama rekening!")
      return
    }
    const balance = parseFloat(newAccBalance.replace(/[^0-9]/g, "")) || 0
    addAccount(newAccName.trim(), balance)
    setNewAccName("")
    setNewAccBalance("")
  }

  // Handle Start Edit Account
  const startEditAccount = (acc: typeof accounts[0]) => {
    setEditingAccId(acc.id)
    setEditAccName(acc.name)
    setEditAccBalance(acc.balance.toString())
  }

  // Handle Save Edit Account
  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccId || !editAccName.trim()) return
    const balance = parseFloat(editAccBalance.replace(/[^0-9]/g, "")) || 0
    editAccount(editingAccId, editAccName.trim(), balance)
    setEditingAccId(null)
  }

  // Handle Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      alert("Harap masukkan nama kategori!")
      return
    }
    addCategory(newCatName.trim(), newCatType, newCatColor)
    setNewCatName("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1F2937] p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="size-5 text-[#3B82F6]" />
            Master Data & Pengaturan Aplikasi
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#111827] p-1.5 border border-white/5">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === "accounts"
                ? "bg-[#3B82F6] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Landmark className="size-4" />
            Master Rekening & Saldo Akun ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === "categories"
                ? "bg-[#3B82F6] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Tag className="size-4" />
            Master Kategori Transaksi ({categories.length})
          </button>
        </div>

        {/* TAB 1: Master Rekening */}
        {activeTab === "accounts" && (
          <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Form Add New Account */}
            <form onSubmit={handleAddAccount} className="rounded-xl border border-white/10 bg-[#111827] p-4 space-y-3">
              <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="size-4" /> Tambah Rekening / Wallet Baru
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">Nama Rekening/E-Wallet</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bank BNI / GoPay / ShopeePay"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 1000000"
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#3B82F6] py-2 text-xs font-bold text-white hover:bg-[#3B82F6]/90 transition-colors"
              >
                + Simpan Rekening Baru
              </button>
            </form>

            {/* List Accounts */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daftar Rekening Aktif</h4>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#111827] p-3.5 hover:border-white/10 transition-colors"
                >
                  {editingAccId === acc.id ? (
                    <form onSubmit={handleSaveEditAccount} className="flex-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editAccName}
                        onChange={(e) => setEditAccName(e.target.value)}
                        className="rounded-md border border-white/20 bg-[#1F2937] px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="number"
                        value={editAccBalance}
                        onChange={(e) => setEditAccBalance(e.target.value)}
                        className="rounded-md border border-white/20 bg-[#1F2937] px-2 py-1 text-xs text-white w-28"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-[#10B981] px-2.5 py-1 text-xs font-bold text-white"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAccId(null)}
                        className="rounded-md bg-gray-600 px-2.5 py-1 text-xs text-white"
                      >
                        Batal
                      </button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-bold text-white">{acc.name}</p>
                        <p className="text-xs text-[#10B981] font-semibold">{formatCurrency(acc.balance)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditAccount(acc)}
                          className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                          title="Edit Rekening"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus rekening "${acc.name}"?`)) {
                              deleteAccount(acc.id)
                            }
                          }}
                          className="rounded p-1.5 text-gray-400 hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
                          title="Hapus Rekening"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Master Kategori */}
        {activeTab === "categories" && (
          <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Form Add New Category */}
            <form onSubmit={handleAddCategory} className="rounded-xl border border-white/10 bg-[#111827] p-4 space-y-3">
              <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="size-4" /> Tambah Kategori Transaksi Baru
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] text-gray-300 mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hobi / Kosmetik"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">Tipe Transaksi</label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                    className="w-full rounded-lg border border-white/10 bg-[#1F2937] px-3 py-2 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">Warna Label</label>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-full h-8 rounded-lg border border-white/10 bg-[#1F2937] cursor-pointer"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#3B82F6] py-2 text-xs font-bold text-white hover:bg-[#3B82F6]/90 transition-colors"
              >
                + Simpan Kategori Baru
              </button>
            </form>

            {/* List Categories */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Expense Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">
                  Kategori Pengeluaran ({categories.filter((c) => c.type === "expense").length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((cat) => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111827] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 text-gray-200">
                          <span className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span>{cat.name}</span>
                        </div>
                        <button
                          onClick={() => deleteCategory(cat.name, "expense")}
                          className="text-gray-500 hover:text-[#EF4444] transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Income Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#10B981] uppercase tracking-wider">
                  Kategori Pemasukan ({categories.filter((c) => c.type === "income").length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {categories
                    .filter((c) => c.type === "income")
                    .map((cat) => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111827] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 text-gray-200">
                          <span className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span>{cat.name}</span>
                        </div>
                        <button
                          onClick={() => deleteCategory(cat.name, "income")}
                          className="text-gray-500 hover:text-[#EF4444] transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
