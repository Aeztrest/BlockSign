"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface WalletState {
  isConnected: boolean
  address: string | null
  walletType: string | null
  balance: number
}

interface WalletContextType {
  wallet: WalletState
  connectWallet: () => Promise<void>
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

  const [algodClient, setAlgodClient] = useState<any>(null)
  const [lute, setLute] = useState<any>(null)

  useEffect(() => {
    // Only initialize on client-side
    if (typeof window !== "undefined") {
      const initializeClients = async () => {
        try {
          const { Algodv2 } = await import("algosdk")
          const LuteConnect = (await import("lute-connect")).default

          const client = new Algodv2("", "https://testnet-api.algonode.cloud", "")
          const luteInstance = new LuteConnect()

          setAlgodClient(client)
          setLute(luteInstance)
        } catch (error) {
          console.error("[v0] Failed to initialize wallet clients:", error)
        }
      }

      initializeClients()
    }
  }, [])

  const connectWallet = async () => {
    if (!algodClient || !lute) {
      throw new Error("Wallet clients not initialized")
    }

    try {
      console.log("[v0] Starting Lute wallet connection...")

      // Get genesis ID from Algod client
      const genesisInfo = await algodClient.genesis().do()
      const genesisID = `${genesisInfo.network}-${genesisInfo.id}`  // "testnet-v1.0"

      console.log("[v0] Genesis ID:", genesisID)

      // Connect to Lute wallet with genesis ID
      const accounts = await lute.connect(genesisID)

      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0]
        console.log("[v0] Connected to address:", userAddress)

        // Get account balance
        let balance = 0
        try {
          const accountInfo = await algodClient.accountInformation(userAddress).do()
          balance = accountInfo.amount / 1000000 // Convert microAlgos to Algos
        } catch (error) {
          console.log("[v0] Could not fetch balance:", error)
        }

        setWallet({
          isConnected: true,
          address: userAddress,
          walletType: "lute",
          balance,
        })

        console.log("[v0] Wallet connected successfully")
      } else {
        throw new Error("No accounts returned from Lute")
      }
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    }
  }

  const disconnectWallet = () => {
    console.log("[v0] Disconnecting wallet...")
    setWallet({
      isConnected: false,
      address: null,
      walletType: null,
      balance: 0,
    })
  }

  const signTransaction = async (txData: any): Promise<string> => {
    if (!wallet.isConnected || !wallet.address || !algodClient || !lute) {
      throw new Error("Wallet not connected or clients not initialized")
    }

    try {
      console.log("[v0] Starting transaction signing...")

      // Use Lute to sign the transaction
      const signedTxn = await lute.signTransaction(txData, wallet.address)

      // Submit to network
      const txId = await algodClient.sendRawTransaction(signedTxn).do()

      console.log("[v0] Transaction signed and submitted:", txId.txId)
      return txId.txId
    } catch (error) {
      console.error("[v0] Transaction signing error:", error)
      throw error
    }
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
