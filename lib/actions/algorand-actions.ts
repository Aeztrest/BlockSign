"use server"

import algosdk from "algosdk"

export async function writeToAlgorandAction(
  cid: string,
  walletAddress: string,
  signedTxnBase64: string,
): Promise<string> {
  try {
    const algodToken = process.env.ALGOD_API_KEY || ""
    const algodServer = "https://testnet-api.algonode.cloud"
    const algodPort = 443

    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort)

    // Decode and send the signed transaction
    const signedTxn = new Uint8Array(Buffer.from(signedTxnBase64, "base64"))
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4)

    return txId
  } catch (error) {
    console.error("Algorand transaction error:", error)
    throw new Error("Algorand işlemi sırasında hata oluştu")
  }
}

export async function getAlgodClientParams(): Promise<{
  server: string
  port: number
  token: string
}> {
  return {
    server: "https://testnet-api.algonode.cloud",
    port: 443,
    token: process.env.ALGOD_API_KEY || "",
  }
}
