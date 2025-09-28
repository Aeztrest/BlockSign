export async function uploadToIPFS(
  pdfBytes: Uint8Array,
  filename = "contract.pdf"
): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!jwt) {
    // development simulasyon (değiştirmedim)
    const mockCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    return `ipfs://${mockCid}`;
  }

  try {
    const file = new File([pdfBytes], filename, { type: "application/pdf" });

    const form = new FormData();
    form.append("file", file, filename);

    // Pinata REST: pinFileToIPFS (JWT ile)
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` }, // Content-Type koyma; FormData kendisi ayarlıyor
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Pinata upload failed:", res.status, detail);
      throw new Error("IPFS yüklemesi sırasında hata oluştu");
    }

    const data = (await res.json()) as { IpfsHash: string };
    const cid = data.IpfsHash;
    return `ipfs://${cid}`;
  } catch (error) {
    console.error("IPFS upload error (Pinata):", error);
    throw new Error("IPFS yüklemesi sırasında hata oluştu");
  }
}
