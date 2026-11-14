import type {
  BriefFollowUps,
  BriefImpactDirection,
  BriefNewsItem,
  DailyBrief,
  EvidenceSnapshot,
  NewsItem,
} from "@sfa/contracts";

type Source = EvidenceSnapshot["sources"][number];

export interface ScoredNewsCandidate {
  item: NewsItem;
  importanceScore: number;
  category: "central-bank" | "macro-energy" | "thai-market" | "us-earnings" | "general";
}

const HIGH_IMPORTANCE_KEYWORDS: Array<{
  pattern: RegExp;
  boost: number;
  category: ScoredNewsCandidate["category"];
}> = [
  { pattern: /\b(fed|fomc|powell|rate|treasury|yield|cpi|inflation|gdp)\b|ดอกเบี้ย|กนง\.|ธปท\.|เงินเฟ้อ|เฟด|บอนด์/i, boost: 4, category: "central-bank" },
  { pattern: /\b(opec|brent|oil|energy|tariff|trade)\b|น้ำมัน|พลังงาน|บาท|ค่าเงิน|ส่งออก/i, boost: 3, category: "macro-energy" },
  { pattern: /\b(set|set50|bot|thailand|thai)\b|ไทย|ตลาดหุ้น|ตลาดหลักทรัพย์|ดัชนี|ท่องเที่ยว/i, boost: 2, category: "thai-market" },
  { pattern: /\b(earnings|profit|revenue|nasdaq|s&p|dow|guidance)\b|กำไร|งบ|ผลประกอบการ|หุ้นสหรัฐ/i, boost: 2, category: "us-earnings" },
];

/** Scores market news importance (1-10) using macro, central-bank, FX, energy, and earnings signals. */
export function scoreNewsImportance(items: NewsItem[]): ScoredNewsCandidate[] {
  return items
    .map((item) => {
      let score = 5;
      let category: ScoredNewsCandidate["category"] = "general";
      for (const rule of HIGH_IMPORTANCE_KEYWORDS) {
        if (rule.pattern.test(item.headline)) {
          score += rule.boost;
          if (category === "general") category = rule.category;
        }
      }
      if (item.listings.length > 0) {
        score += 1;
      }
      return {
        item,
        importanceScore: Math.max(1, Math.min(10, score)),
        category,
      };
    })
    .sort((a, b) => {
      if (b.importanceScore !== a.importanceScore) {
        return b.importanceScore - a.importanceScore;
      }
      return Date.parse(b.item.publishedAt) - Date.parse(a.item.publishedAt);
    });
}

function formatBangkokHhMm(timestamp: string): string {
  const ms = Date.parse(timestamp) + 7 * 3_600_000;
  const d = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function getSourceHostLabel(url: string, sourceId?: string): string {
  if (sourceId?.startsWith("SRC_PUB_") && sourceId.includes("::")) {
    try {
      const encoded = sourceId.slice("SRC_PUB_".length, sourceId.lastIndexOf("::"));
      const decoded = decodeURIComponent(encoded).trim();
      if (decoded) return decoded;
    } catch {
      // Fallback to URL hostname below if sourceId cannot be decoded.
    }
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Market Source";
  }
}

function inferLocalizedSummary(candidate: ScoredNewsCandidate, language: "th" | "en"): {
  headline: string;
  summary: string;
  keyPoints: string[];
  impacts: Array<{ area: string; direction: BriefImpactDirection; label: string }>;
  tag: string;
  followUpTitle: string;
  followUpQuestion: string;
  impactNote: string;
  sector: string;
} {
  const { item, category } = candidate;
  const time = formatBangkokHhMm(item.publishedAt);
  const publisherLabel = getSourceHostLabel(item.source.url, item.source.sourceId);
  const symbols = item.listings.map((l) => l.symbol);
  const symbolLabel = symbols.length > 0 ? symbols.join(", ") : language === "th" ? "ภาพรวมตลาด" : "Broad Market";

  if (category === "central-bank") {
    return language === "th"
      ? {
          headline: item.language === "th" ? item.headline : `[สรุปข่าวต่างประเทศ] ${item.headline}`,
          summary: `ความเคลื่อนไหวนโยบายการเงินและอัตราผลตอบแทนพันธบัตรจาก "${item.headline}" ส่งผลต่อทิศทางกระแสเงินทุนและกลุ่มธนาคาร/เทคโนโลยี`,
          keyPoints: [
            `เผยแพร่เวลา ${time} น. จากแหล่งอ้างอิง ${publisherLabel}`,
            "ตลาดจับตาสัญญาณดอกเบี้ยนโยบายและอัตราผลตอบแทนพันธบัตรรัฐบาล",
            `หลักทรัพย์ที่เกี่ยวข้องโดยตรง: ${symbolLabel}`,
          ],
          impacts: [
            { area: "กลุ่มธนาคาร / การเงิน", direction: "mixed", label: "ผสม" },
            { area: "หุ้นเติบโต / เทคโนโลยี", direction: "mixed", label: "อ่อนไหวต่อดอกเบี้ย" },
          ],
          tag: `นโยบายการเงิน · ${time}`,
          followUpTitle: item.headline,
          followUpQuestion: `ประเด็น "${item.headline}" จาก Daily Brief วันนี้ส่งผลต่อตลาดไทยและสหรัฐฯ อย่างไร?`,
          impactNote: "กระทบมุมมองดอกเบี้ย อัตราผลตอบแทนพันธบัตร และกลุ่มธนาคาร/หุ้นเติบโต",
          sector: "การเงินและมหภาค",
        }
      : {
          headline: item.headline,
          summary: `Monetary policy and bond yield developments from "${item.headline}" influence cross-market capital flows and rate-sensitive sectors.`,
          keyPoints: [
            `Published at ${time} (+07:00) via ${publisherLabel}`,
            "Investors are monitoring central-bank rate signals and sovereign bond yields",
            `Referenced symbols: ${symbolLabel}`,
          ],
          impacts: [
            { area: "Banks / Financials", direction: "mixed", label: "Mixed" },
            { area: "Growth / Technology", direction: "mixed", label: "Rate-sensitive" },
          ],
          tag: `Policy · ${time}`,
          followUpTitle: item.headline,
          followUpQuestion: `How does "${item.headline}" in today's Daily Brief affect Thai and US equities?`,
          impactNote: "Affects rate expectations, bond yields, banks, and growth stocks",
          sector: "Macro & Financials",
        };
  }

  if (category === "macro-energy") {
    return language === "th"
      ? {
          headline: item.language === "th" ? item.headline : `[พลังงาน/มหภาค] ${item.headline}`,
          summary: `ปัจจัยด้านราคาพลังงาน ค่าเงิน หรือการค้าระหว่างประเทศใน "${item.headline}" กระทบต้นทุนและกลุ่มพลังงาน/ขนส่งโดยตรง`,
          keyPoints: [
            `เผยแพร่เวลา ${time} น. จาก ${publisherLabel}`,
            "ความผันผวนของราคาพลังงานและอัตราแลกเปลี่ยนมีผลต่อเงินเฟ้อและกำไรกลุ่มพลังงาน",
            `หลักทรัพย์ที่เกี่ยวข้อง: ${symbolLabel}`,
          ],
          impacts: [
            { area: "พลังงานและปิโตรเคมี", direction: "mixed", label: "ผันผวน" },
            { area: "สายการบินและขนส่ง", direction: "positive", label: "บวกเมื่อต้นทุนลด" },
          ],
          tag: `มหภาค · ${time}`,
          followUpTitle: item.headline,
          followUpQuestion: `ข่าว "${item.headline}" ใน Daily Brief วันนี้กระทบกลุ่มพลังงานและเงินเฟ้ออย่างไร?`,
          impactNote: "อาจกระทบหุ้นพลังงาน ต้นทุนขนส่ง และแนวโน้มเงินเฟ้อ",
          sector: "พลังงานและมหภาค",
        }
      : {
          headline: item.headline,
          summary: `Energy, FX, and trade shifts highlighted in "${item.headline}" carry direct cost and margin implications across energy and transport.`,
          keyPoints: [
            `Published at ${time} (+07:00) via ${publisherLabel}`,
            "Energy price and FX swings affect inflation expectations and sector margins",
            `Referenced symbols: ${symbolLabel}`,
          ],
          impacts: [
            { area: "Energy & Petrochemicals", direction: "mixed", label: "Volatile" },
            { area: "Transport & Airlines", direction: "positive", label: "Lower cost tailwind" },
          ],
          tag: `Macro · ${time}`,
          followUpTitle: item.headline,
          followUpQuestion: `How does "${item.headline}" in today's Daily Brief affect energy stocks and inflation?`,
          impactNote: "Impacts energy producers, transport costs, and inflation outlook",
          sector: "Energy & Macro",
        };
  }

  return language === "th"
    ? {
        headline: item.language === "th" ? item.headline : `[ตลาดหุ้น] ${item.headline}`,
        summary: `อัปเดตสำคัญของตลาดและบริษัทจดทะเบียน: "${item.headline}" สำหรับใช้ติดตามปัจจัยพื้นฐานและบรรยากาศการลงทุนวันนี้`,
        keyPoints: [
          `เผยแพร่เวลา ${time} น. จาก ${publisherLabel}`,
          `คะแนนความสำคัญจาก AI: ${candidate.importanceScore}/10`,
          `หลักทรัพย์ที่เกี่ยวข้อง: ${symbolLabel}`,
        ],
        impacts: [
          { area: "บรรยากาศการลงทุนโดยรวม", direction: "mixed", label: "ติดตามต่อเนื่อง" },
        ],
        tag: `ข่าวตลาด · ${time}`,
        followUpTitle: item.headline,
        followUpQuestion: `ช่วยสรุปประเด็นสำคัญและปัจจัยเสี่ยงจากข่าว "${item.headline}" ใน Daily Brief วันนี้`,
        impactNote: "ส่งผลต่อความเชื่อมั่นและทิศทางหุ้นที่เกี่ยวข้อง",
        sector: "ตลาดทุน",
      }
    : {
        headline: item.headline,
        summary: `Key market and corporate update: "${item.headline}" shaping today's market sentiment and fundamental watchpoints.`,
        keyPoints: [
          `Published at ${time} (+07:00) via ${publisherLabel}`,
          `AI importance score: ${candidate.importanceScore}/10`,
          `Referenced symbols: ${symbolLabel}`,
        ],
        impacts: [
          { area: "Overall Market Sentiment", direction: "mixed", label: "Watch closely" },
        ],
        tag: `Market News · ${time}`,
        followUpTitle: item.headline,
        followUpQuestion: `Summarize the key drivers and risks of "${item.headline}" from today's Daily Brief.`,
        impactNote: "Influences sentiment and related listed companies",
        sector: "Equities",
      };
}

interface GeminiStructuredPayload {
  shortTextTh: string;
  fullTextTh: string;
  shortTextEn: string;
  fullTextEn: string;
}

async function tryGenerateWithGemini(input: {
  apiKey: string;
  publicationDate: string;
  selected: ScoredNewsCandidate[];
  evidenceCutoff: string;
}): Promise<GeminiStructuredPayload | null> {
  const newsContext = input.selected
    .map(
      (c, idx) =>
        `${idx + 1}. [score ${c.importanceScore}/10] (${c.item.publishedAt}) ${c.item.headline} [sourceId=${c.item.source.sourceId}]`,
    )
    .join("\n");

  const prompt = [
    `You are generating a factual, neutral bilingual Daily Brief for Thai retail investors for Bangkok date ${input.publicationDate} (evidence cutoff ${input.evidenceCutoff}).`,
    "Strict rules:",
    "- Do NOT invent prices, percentages, or stories not present in the input items.",
    "- Both Thai and English summaries must preserve the exact same material facts, entities, and cutoff.",
    "- Do NOT give definitive buy/sell instructions.",
    "Input scored news:",
    newsContext,
    'Respond strictly in JSON with keys: "shortTextTh", "fullTextTh", "shortTextEn", "fullTextEn".',
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(input.apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText) as Partial<GeminiStructuredPayload>;
  if (
    typeof parsed.shortTextTh === "string" &&
    parsed.shortTextTh.trim() &&
    typeof parsed.fullTextTh === "string" &&
    parsed.fullTextTh.trim() &&
    typeof parsed.shortTextEn === "string" &&
    parsed.shortTextEn.trim() &&
    typeof parsed.fullTextEn === "string" &&
    parsed.fullTextEn.trim()
  ) {
    return {
      shortTextTh: parsed.shortTextTh.trim(),
      fullTextTh: parsed.fullTextTh.trim(),
      shortTextEn: parsed.shortTextEn.trim(),
      fullTextEn: parsed.fullTextEn.trim(),
    };
  }
  return null;
}

/** Generates an atomic bilingual DailyBrief and bound FollowUp cards from one EvidenceSnapshot. */
export async function generateBilingualDailyBrief(input: {
  publicationDate: string;
  publishedAt: string;
  evidenceCutoff: string;
  newsItems: NewsItem[];
  maxStories?: number;
  geminiApiKey?: string;
}): Promise<{ brief: DailyBrief; followUps: BriefFollowUps }> {
  if (input.newsItems.length === 0) {
    throw new Error("Cannot generate Daily Brief without any market news items");
  }

  const limit = input.maxStories ?? 5;
  const scored = scoreNewsImportance(input.newsItems);
  const selected = scored.slice(0, limit);

  // Ensure bilingual balance (at least one Thai story if present) so Thai market news is never crowded out.
  if (selected.length === limit) {
    const firstThai = scored.find((c) => c.item.language === "th");
    const firstEn = scored.find((c) => c.item.language === "en");
    if (firstThai && !selected.some((c) => c.item.language === "th")) {
      selected[selected.length - 1] = firstThai;
    } else if (firstEn && !selected.some((c) => c.item.language === "en")) {
      selected[selected.length - 1] = firstEn;
    }
  }

  const uniqueSources: Source[] = [];
  const seenSourceIds = new Set<string>();
  for (const candidate of selected) {
    if (!seenSourceIds.has(candidate.item.source.sourceId)) {
      seenSourceIds.add(candidate.item.source.sourceId);
      uniqueSources.push(candidate.item.source);
    }
  }

  const compactTime = input.publishedAt.replace(/[-:T+]/g, "").slice(0, 12);
  const snapshotId = `SNAP_${input.publicationDate.replace(/-/g, "_")}_${compactTime}`;
  const publicationId = `BRIEF_${input.publicationDate.replace(/-/g, "_")}_${compactTime}`;

  const evidence: EvidenceSnapshot = {
    snapshotId,
    evidenceCutoff: input.evidenceCutoff,
    sources: uniqueSources,
  };

  const thNewsItems: BriefNewsItem[] = [];
  const enNewsItems: BriefNewsItem[] = [];
  const cards: BriefFollowUps["cards"] = [];

  for (let i = 0; i < selected.length; i += 1) {
    const candidate = selected[i];
    const thInfo = inferLocalizedSummary(candidate, "th");
    const enInfo = inferLocalizedSummary(candidate, "en");
    const publishedTime = formatBangkokHhMm(candidate.item.publishedAt);
    const sourceName = getSourceHostLabel(candidate.item.source.url, candidate.item.source.sourceId);
    const relatedSymbols = candidate.item.listings.map((l) => l.symbol);

    thNewsItems.push({
      newsId: candidate.item.newsId,
      publishedTime,
      headline: thInfo.headline,
      sourceName,
      sourceId: candidate.item.source.sourceId,
      importanceScore: candidate.importanceScore,
      sourceCount: 1,
      summary: thInfo.summary,
      keyPoints: thInfo.keyPoints,
      impacts: thInfo.impacts,
      relatedSymbols,
    });

    enNewsItems.push({
      newsId: candidate.item.newsId,
      publishedTime,
      headline: enInfo.headline,
      sourceName,
      sourceId: candidate.item.source.sourceId,
      importanceScore: candidate.importanceScore,
      sourceCount: 1,
      summary: enInfo.summary,
      keyPoints: enInfo.keyPoints,
      impacts: enInfo.impacts,
      relatedSymbols,
    });

    if (i < 3) {
      cards.push({
        cardId: `${publicationId}_CARD_${i + 1}`,
        variants: {
          th: {
            title: thInfo.followUpTitle,
            question: thInfo.followUpQuestion,
            tag: thInfo.tag,
            impact: thInfo.impactNote,
            sector: thInfo.sector,
          },
          en: {
            title: enInfo.followUpTitle,
            question: enInfo.followUpQuestion,
            tag: enInfo.tag,
            impact: enInfo.impactNote,
            sector: enInfo.sector,
          },
        },
      });
    }
  }

  let llmTexts: GeminiStructuredPayload | null = null;
  if (input.geminiApiKey) {
    llmTexts = await tryGenerateWithGemini({
      apiKey: input.geminiApiKey,
      publicationDate: input.publicationDate,
      selected,
      evidenceCutoff: input.evidenceCutoff,
    });
  }

  const thTopics = thNewsItems.map((n) => n.headline).join("; ");
  const enTopics = enNewsItems.map((n) => n.headline).join("; ");
  const cutoffHhMm = formatBangkokHhMm(input.evidenceCutoff);

  const shortTextTh =
    llmTexts?.shortTextTh ??
    `สรุปภาพรวมตลาด ณ ${input.publicationDate} เวลา ${cutoffHhMm} น. คัดเลือก ${selected.length} ข่าวสำคัญจาก ${input.newsItems.length} ข่าว: ${thTopics}`;
  const fullTextTh =
    llmTexts?.fullTextTh ??
    `รายงาน Daily Brief ประจำวันที่ ${input.publicationDate} (ตัดข้อมูล ณ ${input.evidenceCutoff}) จากชุดหลักฐาน ${snapshotId} ครอบคลุมข่าวไทย สหรัฐฯ และเศรษฐกิจโลกทั้งหมด ${selected.length} ประเด็นสำคัญ:\n` +
      thNewsItems.map((n, idx) => `${idx + 1}. [${n.importanceScore}/10] ${n.headline} — ${n.summary}`).join("\n");

  const shortTextEn =
    llmTexts?.shortTextEn ??
    `Market summary for ${input.publicationDate} as of ${cutoffHhMm} (+07:00). Selected ${selected.length} key stories from ${input.newsItems.length} items: ${enTopics}`;
  const fullTextEn =
    llmTexts?.fullTextEn ??
    `Daily Brief for ${input.publicationDate} (evidence cutoff ${input.evidenceCutoff}, snapshot ${snapshotId}) covering ${selected.length} top Thai, US, and global market stories:\n` +
      enNewsItems.map((n, idx) => `${idx + 1}. [${n.importanceScore}/10] ${n.headline} — ${n.summary}`).join("\n");

  const brief: DailyBrief = {
    kind: "daily-brief",
    publicationId,
    publicationDate: input.publicationDate,
    publishedAt: input.publishedAt,
    evidence,
    variants: {
      th: {
        language: "th",
        shortText: shortTextTh,
        fullText: fullTextTh,
        scannedCount: input.newsItems.length,
        newsItems: thNewsItems,
      },
      en: {
        language: "en",
        shortText: shortTextEn,
        fullText: fullTextEn,
        scannedCount: input.newsItems.length,
        newsItems: enNewsItems,
      },
    },
  };

  const followUps: BriefFollowUps = {
    publicationId,
    publicationDate: input.publicationDate,
    cards,
  };

  return { brief, followUps };
}
