import algosdk from "algosdk"

export async function createAlgorandTransaction(
  cid: string,
  walletAddress: string,
  algodParams: { server: string; port: number; token: string },
): Promise<any> {
  try {
    const algodClient = new algosdk.Algodv2(algodParams.token, algodParams.server, algodParams.port)

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

    return {
      txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64"),
    }
  } catch (error) {
    console.error("Algorand transaction creation error:", error)
    throw new Error("Algorand işlemi oluşturulurken hata oluştu")
  }
}
