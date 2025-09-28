export async function uploadToIPFS(pdfBytes: Uint8Array, filename = "contract.pdf"): Promise<string> {
  try {
    const file = new File([pdfBytes], filename, { type: "application/pdf" })

    const form = new FormData()
    form.append("file", file, filename)

    // AlgoBack upload endpoint'i kullanılıyor
    const res = await fetch("https://algoback.hackstack.com.tr/upload", {
      method: "POST",
      headers: {
        accept: "application/json",
        // Content-Type koyma; FormData kendisi ayarlıyor
      },
      body: form,
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("AlgoBack upload failed:", res.status, detail)
      throw new Error("Dosya yüklemesi sırasında hata oluştu")
    }

    const data = await res.json()

    // AlgoBack'den dönen response'a göre URL'i döndür
    // Response formatını bilmediğimiz için generic bir yaklaşım kullanıyoruz
    const fileUrl = data.url || data.file_url || data.path || data.link

    if (!fileUrl) {
      console.error("AlgoBack response:", data)
      throw new Error("Dosya URL'si alınamadı")
    }

    return fileUrl
  } catch (error) {
    console.error("AlgoBack upload error:", error)
    throw new Error("Dosya yüklemesi sırasında hata oluştu")
  }
}
