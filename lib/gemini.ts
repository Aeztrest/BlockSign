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

/** helper: pretty date for TR */
function formatDateTR(dateStr?: string) {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR")
  } catch {
    return dateStr
  }
}

/** try to unescape common JSON-escaped sequences so text becomes readable */
function unescapeText(s: string) {
  if (!s) return s
  // convert common escapes like \n, \t, \" etc
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\u00([0-9A-Fa-f]{2})/g, (_m, p1) => String.fromCharCode(parseInt(p1, 16)))
}

/** extract first JSON-like substring (naive) */
function extractJsonSubstring(text: string): string | null {
  if (!text) return null
  // try fenced block first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenced && fenced[1]) return fenced[1].trim()

  // try to find substring that starts with { and ends with matching }
  const curly = text.match(/\{[\s\S]*\}/)
  if (curly) return curly[0]
  return null
}

/** try parse JSON with some fallbacks */
function tryParseJsonMaybe(text: string): any | null {
  if (!text) return null
  // direct parse
  try {
    return JSON.parse(text)
  } catch {
    // try unescaping common sequences then parse
    try {
      const t = unescapeText(text)
      return JSON.parse(t)
    } catch {
      // strip leading/trailing quotes if present and try
      const stripped = text.replace(/^\s*["'`]+\s*/, "").replace(/\s*["'`]+\s*$/, "")
      try {
        return JSON.parse(unescapeText(stripped))
      } catch {
        return null
      }
    }
  }
}

/** Try to extract the human-readable contract + summary + risks from free text */
function parseContractFromPlainText(text: string): GeneratedContract {
  const contract = text.trim()

  // summary: look for ÖZET or "Özet" heading, otherwise first bullet list after contract
  let summary: string[] = []
  let riskAnalysis: Array<{ level: string; description: string }> = []

  const summaryMatch =
    text.match(/(?:^|\n)#{0,3}\s*ÖZET\s*[:\-]?\s*([\s\S]*?)(?:\n#{1,3}\s|$)/i) ||
    text.match(/(?:^|\n)#{0,3}\s*Özet\s*[:\-]?\s*([\s\S]*?)(?:\n#{1,3}\s|$)/i)
  if (summaryMatch) {
    const bullets = summaryMatch[1]
      .split(/\n/)
      .map((l) => l.replace(/^\s*[-*]\s*/, "").trim())
      .filter(Boolean)
    if (bullets.length) summary = bullets.slice(0, 6)
  }

  // fallback: search for any bullet list near top
  if (summary.length === 0) {
    const bulletsAny = text.match(/(^|\n)\s*[-*]\s+.+/g)
    if (bulletsAny) {
      summary = bulletsAny.map((b) => b.replace(/(^|\n)\s*[-*]\s+/, "").trim()).slice(0, 6)
    }
  }

  // risk: search Risk Analizi / RİSK / RISK headings
  const riskMatch =
    text.match(/(?:^|\n)#{0,3}\s*(Risk Analizi|RİSK|RISK|RİSK ANALİZİ)\s*[:\-]?\s*([\s\S]*?)(?:\n#{1,3}\s|$)/i) ||
    text.match(/(?:^|\n)(RİSK|RISK)[\s\S]{0,200}/i)
  if (riskMatch && riskMatch[2]) {
    const lines = riskMatch[2].split(/\n/).map((l) => l.trim()).filter(Boolean)
    for (const l of lines) {
      // try parse "Level - desc"
      const m = l.match(/(High|Medium|Low|Yüksek|Orta|Düşük)\s*[:\-–]\s*(.+)/i)
      if (m) {
        let level = m[1]
        const desc = m[2]
        if (/yüksek/i.test(level)) level = "High"
        if (/orta/i.test(level)) level = "Medium"
        if (/düşük/i.test(level)) level = "Low"
        riskAnalysis.push({ level, description: desc })
      } else {
        // fallback: default Medium
        riskAnalysis.push({ level: "Medium", description: l })
      }
    }
  }

  if (summary.length === 0) summary = ["Özet otomatik olarak üretilemedi."]
  if (riskAnalysis.length === 0) riskAnalysis = [{ level: "Medium", description: "Risk analizi otomatik olarak üretilemedi." }]

  return { contract, summary, riskAnalysis }
}

export async function generateContract(params: ContractParams): Promise<GeneratedContract> {
  // prefer server-side key variable but keep compatibility if only NEXT_PUBLIC present
  const apiKey = process.env.GENAI_API_KEY || process.env.GENERATIVE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    // dev fallback (unchanged)
    return {
      contract: `# FREELANCE YAZILIM GELİŞTİRME SÖZLEŞMESİ\n\n## TARAFLAR\n${params.parties
        .map((p) => `**${p.name}:** ${p.address}`)
        .join("\n")}\n\n## PROJE KAPSAMI\n${params.prompt}\n\n## ÖDEME KOŞULLARI\n- Para birimi: ${params.currency}\n- Ülke: ${params.country}\n\n## TESLİM TARİHİ\n${params.deadline ? `Proje ${formatDateTR(params.deadline)} tarihine kadar tamamlanacaktır.` : "Teslim tarihi belirtilmemiştir."}\n\n## FESİH KOŞULLARI\n${params.termination ? `Her iki taraf da ${params.termination} gün önceden yazılı bildirimde bulunarak sözleşmeyi feshedebilir.` : "Fesih koşulları belirtilmemiştir."}`,
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
    // model selection: prefer a chat/text model; adjust name if your project uses a different model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // craft a strict prompt instructing JSON output but allowing human fallback
    const contractPrompt = `
Aşağıdaki bilgilere göre DETAYLI ve profesyonel bir Türkçe sözleşme oluştur. Kullanıcının verdiği bilgiler:
Açıklama: ${params.prompt}
Taraflar: ${params.parties.map((p) => `${p.name} (${p.address || "adres yok"})`).join("; ")}
Ülke: ${params.country}
Para Birimi: ${params.currency}
Son Tarih: ${formatDateTR(params.deadline)}
Fesih Süresi (gün): ${params.termination || "Belirtilmemiş"}

ÇIKTI İSTEĞİ (öncelik sırası):
1) **Tercihen JSON** formatında tek bir obje döndür: 
{ "contract": "...", "summary": ["..."], "riskAnalysis": [{ "level":"High|Medium|Low", "description":"..." }] }

2) Eğer JSON vermezseniz SON ÇARE olarak **SADECE** okunabilir Markdown formatında şu bölümleri verin:
- Başlık: # <SÖZLEŞME ADI>
- ## TARAFLAR
- ## PROJE KAPSAMI
- ## ÖDEME KOŞULLARI
- ## TESLİM TARİHİ
- ## FİKRİ MÜLKİYET
- ## FESİH KOŞULLARI
- SONUNDA: "## ÖZET" (3-6 madde) ve "## RISK ANALIZI" (her madde level:desc)

**ÖNEMLİ:** Eğer JSON döndürürseniz lütfen **doğrudan geçerli JSON** döndürün (kod bloğu veya kaçış dizisi kullanmayın). Ancak eğer sistem JSON yerine Markdown döndürürse, verdiğiniz Markdown'ı temiz ve eksiksiz yapın.
`

    const result = await model.generateContent(contractPrompt)
    const response = await result.response
    // response.text() must be awaited
    const rawText = String(await response.text())

    // First try: extract JSON substring and parse
    const jsonSub = extractJsonSubstring(rawText)
    if (jsonSub) {
      const parsed = tryParseJsonMaybe(jsonSub)
      if (parsed && (parsed.contract || parsed.summary || parsed.riskAnalysis)) {
        // normalize fields
        const contractRaw = typeof parsed.contract === "string" ? parsed.contract : JSON.stringify(parsed.contract)
        const contract = unescapeText(contractRaw).replace(/^"(.*)"$/s, "$1").trim()
        const summaryArr = Array.isArray(parsed.summary) ? parsed.summary.map(String) : ["Özet bulunamadı"]
        const riskArr = Array.isArray(parsed.riskAnalysis)
          ? parsed.riskAnalysis.map((r: any) => ({ level: String(r.level ?? "Medium"), description: String(r.description ?? r) }))
          : [{ level: "Medium", description: "Risk analizi yok" }]

        return { contract, summary: summaryArr, riskAnalysis: riskArr }
      }
    }

    // Second try: if whole response looks like JSON string (escaped), attempt parse full
    const tryFull = tryParseJsonMaybe(rawText)
    if (tryFull && (tryFull.contract || tryFull.summary || tryFull.riskAnalysis)) {
      const contractRaw = typeof tryFull.contract === "string" ? tryFull.contract : JSON.stringify(tryFull.contract)
      const contract = unescapeText(contractRaw).replace(/^"(.*)"$/s, "$1").trim()
      const summaryArr = Array.isArray(tryFull.summary) ? tryFull.summary.map(String) : ["Özet bulunamadı"]
      const riskArr = Array.isArray(tryFull.riskAnalysis)
        ? tryFull.riskAnalysis.map((r: any) => ({ level: String(r.level ?? "Medium"), description: String(r.description ?? r) }))
        : [{ level: "Medium", description: "Risk analizi yok" }]

      return { contract, summary: summaryArr, riskAnalysis: riskArr }
    }

    // Third: fallback to parsing as plain Markdown/text
    // If model returned with escaped newlines, unescape for readability
    const readable = unescapeText(rawText)
    const parsedPlain = parseContractFromPlainText(readable)
    return parsedPlain
  } catch (error) {
    console.error("Gemini API error (generateContract):", error)
    // fallback simulated
    return {
      contract: `# UYARI: Otomatik sözleşme oluşturulamadı\n\nSistem bir hata ile karşılaşıldı. Lütfen daha sonra tekrar deneyin.\n\n(Hata: ${String(error)})`,
      summary: ["Sistemsel hata nedeniyle sözleşme oluşturulamadı."],
      riskAnalysis: [{ level: "High", description: "AI çağrısı sırasında hata oluştu." }],
    }
  }
}
