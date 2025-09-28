"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface WalletState {
  isConnected: boolean
  address: string | null
  walletType: string | null
  balance: number
}

interface WalletContextType {
  wallet: WalletState
  connectWallet: (walletType: string) => Promise<void>
  disconnectWallet: () => void
  signTransaction: (txData: any) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    walletType: null,
    balance: 0,
  })

  // Mock wallet connection - In real implementation, use @txnlab/use-wallet
  const connectWallet = async (walletType: string) => {
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock successful connection
    const mockAddress = `ALGO${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const mockBalance = Math.floor(Math.random() * 1000) + 100

    setWallet({
      isConnected: true,
      address: mockAddress,
      walletType,
      balance: mockBalance,
    })
  }

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      walletType: null,
      balance: 0,
    })
  }

  const signTransaction = async (txData: any): Promise<string> => {
    if (!wallet.isConnected) {
      throw new Error("Wallet not connected")
    }

    // Simulate signing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Return mock transaction ID
    return `TX${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  return (
    <WalletContext.Provider value={{ wallet, connectWallet, disconnectWallet, signTransaction }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
