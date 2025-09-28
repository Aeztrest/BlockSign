import algosdk from "algosdk"

export async function writeToAlgorand(
  cid: string,
  walletAddress: string,
  signTransaction: (txns: any[]) => Promise<Uint8Array[]>,
): Promise<string> {
  try {
    // Algorand TestNet configuration
    const algodToken = process.env.NEXT_PUBLIC_ALGOD_API_KEY || ""
    const algodServer = "https://testnet-api.algonode.cloud"
    const algodPort = 443

    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort)

    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do()

    // Create transaction with IPFS CID in note field
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: walletAddress,
      to: walletAddress, // Self-transaction
      amount: 0, // Zero amount
      note: new Uint8Array(Buffer.from(cid)),
      suggestedParams,
    })

    // Sign transaction using wallet
    const signedTxns = await signTransaction([
      {
        txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64"),
      },
    ])

    // Send transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxns[0]).do()

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4)

    return txId
  } catch (error) {
    console.error("Algorand transaction error:", error)
    throw new Error("Algorand işlemi sırasında hata oluştu")
  }
}
