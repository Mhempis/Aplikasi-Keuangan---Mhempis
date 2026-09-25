"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface VisibilityContextType {
  isAmountVisible: boolean
  toggleAmountVisibility: () => void
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined)

export function VisibilityProvider({ children }: { children: ReactNode }) {
  const [isAmountVisible, setIsAmountVisible] = useState(false)

  const toggleAmountVisibility = () => {
    setIsAmountVisible((prev) => !prev)
  }

  return (
    <VisibilityContext.Provider value={{ isAmountVisible, toggleAmountVisibility }}>
      {children}
    </VisibilityContext.Provider>
  )
}

export function useVisibility() {
  const context = useContext(VisibilityContext)
  if (!context) {
    throw new Error("useVisibility must be used within a VisibilityProvider")
  }
  return context
}

/**
 * Helper untuk format nominal dengan opsi hide
 */
export function useFormattedAmount() {
  const { isAmountVisible } = useVisibility()
  
  return (amount: number, formatter: (n: number) => string = (n) => n.toLocaleString("id-ID")) => {
    if (!isAmountVisible) {
      return "••••••"
    }
    return formatter(amount)
  }
}
