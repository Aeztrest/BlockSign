import { GoogleGenerativeAI } from "@google/generative-ai"

interface ContractParams {
  prompt: string
  parties: Array<{ name: string; address: string }>
  country: string
  currency: string
  deadline: string
  termination: string
}

interface GeneratedContract {
  contract: string
  summary: string[]
  riskAnalysis: Array<{ level: string; description: string }>
}

export async function generateContract(params: ContractParams): Promise<GeneratedContract> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    // Simulate for development
    return {
      contract: `# FREELANCE YAZILIM GELİŞTİRME SÖZLEŞMESİ\n\n## TARAFLAR\n${params.parties.map((p) => `**${p.name}:** ${p.address}`).join("\n")}\n\n## PROJE KAPSAMI\n${params.prompt}\n\n## ÖDEME KOŞULLARI\n- Para birimi: ${params.currency}\n- Ülke: ${params.country}\n\n## TESLİM TARİHİ\n${params.deadline ? `Proje ${new Date(params.deadline).toLocaleDateString("tr-TR")} tarihine kadar tamamlanacaktır.` : "Teslim tarihi belirtilmemiştir."}\n\n## FESİH KOŞULLARI\n${params.termination ? `Her iki taraf da ${params.termination} gün önceden yazılı bildirimde bulunarak sözleşmeyi feshedebilir.` : "Fesih koşulları belirtilmemiştir."}`,
      summary: [
        "AI tarafından oluşturulan sözleşme",
        `Para birimi: ${params.currency}`,
        `Ülke: ${params.country}`,
        `${params.parties.length} taraf dahil`,
      ],
      riskAnalysis: [{ level: "Low", description: "Geliştirme ortamında simüle edildi" }],
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flush" })

    const contractPrompt = `
Aşağıdaki bilgilere göre detaylı bir Türkçe sözleşme oluştur:

Açıklama: ${params.prompt}
Taraflar: ${JSON.stringify(params.parties)}
Ülke: ${params.country}
Para Birimi: ${params.currency}
Son Tarih: ${params.deadline}
Fesih Süresi: ${params.termination} gün

Lütfen şu formatı kullan:
1. Markdown formatında tam sözleşme metni
2. Sözleşmenin 5 maddelik özeti
3. Risk analizi (Yüksek/Orta/Düşük seviyelerinde)

JSON formatında döndür: {"contract": "...", "summary": ["..."], "riskAnalysis": [{"level": "...", "description": "..."}]}
`

    const result = await model.generateContent(contractPrompt)
    const response = await result.response
    const text = response.text()

    try {
      return JSON.parse(text)
    } catch {
      // Fallback if JSON parsing fails
      return {
        contract: text,
        summary: ["AI tarafından oluşturulan sözleşme"],
        riskAnalysis: [{ level: "Medium", description: "JSON parse hatası" }],
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error)
    throw new Error("Sözleşme oluşturulurken hata oluştu")
  }
}
