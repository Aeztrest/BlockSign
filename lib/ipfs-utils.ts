import pinataSDK from "@pinata/sdk"
import stream from "stream"

export async function uploadToIPFS(pdfBytes: Uint8Array, filename = "contract.pdf"): Promise<string> {
  const token = process.env.IPFS_TOKEN

  if (!token) {
    // Simulate for development (same as before)
    const mockCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    return `ipfs://${mockCid}`
  }

  // Helper: sleep for backoff
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))
  const MAX_RETRIES = 3

  // Build pinata client based on token format
  let client: any
  try {
    if (token.includes(".")) {
      // looks like JWT
      client = pinataSDK(undefined as any, undefined as any, { pinataJWT: token })
    } else if (token.includes(":")) {
      // expect API_KEY:API_SECRET
      const [key, secret] = token.split(":")
      if (!key || !secret) throw new Error("Pinata token format invalid (expected key:secret).")
      client = pinataSDK(key, secret)
    } else {
      throw new Error("Pinata token provided but format not recognized. Use JWT or 'API_KEY:API_SECRET'.")
    }
  } catch (e) {
    console.error("[uploadToIPFS] Pinata client creation failed:", e)
    throw new Error("IPFS yüklemesi sırasında hata oluştu")
  }

  // Try uploading with retries (streams are consumed so recreate each attempt)
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // create readable stream from buffer for this attempt
    const readable = new stream.PassThrough()
    readable.end(Buffer.from(pdfBytes))

    try {
      const options = {
        pinataMetadata: { name: filename },
        pinataOptions: { cidVersion: 1 },
      }

      const result = await client.pinFileToIPFS(readable, options)
      // Pinata returns result.IpfsHash
      const cid = result?.IpfsHash || result?.IpfsHash || result?.IpfsHash
      if (!cid) throw new Error("Pinata returned no CID")
      return `ipfs://${cid}`
    } catch (error: any) {
      console.error(`[uploadToIPFS] attempt ${attempt} failed:`, error?.message ?? error)
      if (attempt === MAX_RETRIES) {
        console.error("[uploadToIPFS] All attempts failed.")
        throw new Error("IPFS yüklemesi sırasında hata oluştu")
      }
      // exponential backoff with jitter
      const backoff = Math.pow(2, attempt) * 300 + Math.floor(Math.random() * 200)
      await sleep(backoff)
      // continue to next attempt
    }
  }

  // should not reach here
  throw new Error("IPFS yüklemesi sırasında hata oluştu")
}
