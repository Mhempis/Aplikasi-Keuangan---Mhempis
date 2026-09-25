"use client"

import { useState } from "react"
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from "lucide-react"
import { TransactionModal } from "./transaction-modal"
import { TransferModal } from "./transfer-modal"
import { type TransactionType } from "@/lib/finance-data"

export function QuickActions() {
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [modalType, setModalType] = useState<TransactionType>("expense")

  const handleOpenTxModal = (type: TransactionType) => {
    setModalType(type)
    setIsTxModalOpen(true)
  }

  return (
    <>
      <section aria-label="Aksi cepat" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleOpenTxModal("expense")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 py-3 text-sm font-bold text-white shadow-md transition-transform hover:bg-[#EF4444]/90 active:scale-[0.98]"
        >
          <ArrowDownCircle className="size-5" />
          Catat Pengeluaran
        </button>

        <button
          type="button"
          onClick={() => handleOpenTxModal("income")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-3 text-sm font-bold text-white shadow-md transition-transform hover:bg-[#10B981]/90 active:scale-[0.98]"
        >
          <ArrowUpCircle className="size-5" />
          Catat Pemasukan
        </button>

        <button
          type="button"
          onClick={() => setIsTransferModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1F2937] px-4 py-3 text-sm font-bold text-gray-200 transition-colors hover:border-[#3B82F6]/50 hover:text-white"
        >
          <ArrowRightLeft className="size-5 text-[#3B82F6]" />
          Transfer Tabungan / Rekening
        </button>
      </section>

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultType={modalType}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultTab="savings"
      />
    </>
  )
}
