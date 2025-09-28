import { Web3Storage } from "web3.storage"

export async function uploadToIPFS(pdfBytes: Uint8Array, filename = "contract.pdf"): Promise<string> {
  const token = process.env.NEXT_PUBLIC_IPFS_TOKEN

  if (!token) {
    // Simulate for development
    const mockCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    return `ipfs://${mockCid}`
  }

  try {
    const client = new Web3Storage({ token })

    const file = new File([pdfBytes], filename, { type: "application/pdf" })
    const cid = await client.put([file])

    return `ipfs://${cid}`
  } catch (error) {
    console.error("IPFS upload error:", error)
    throw new Error("IPFS yüklemesi sırasında hata oluştu")
  }
}
