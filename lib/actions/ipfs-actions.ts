"use server"

import { uploadToIPFS } from "../ipfs-utils"

export async function uploadToIPFSAction(pdfBytes: Uint8Array, filename = "contract.pdf"): Promise<string> {
  return await uploadToIPFS(pdfBytes, filename)
}
