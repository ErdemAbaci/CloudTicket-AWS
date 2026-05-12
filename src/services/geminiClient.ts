import { RecommendedEvent, TicketPurchaseHistory } from "../types";

interface GeminiRecommendation {
  eventId: string;
  reason?: string;
  signals?: string[];
  confidence?: number;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const safeJsonParse = (value: string) => {
  const cleaned = value
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};

const buildPrompt = ({
  history,
  candidates,
}: {
  history: TicketPurchaseHistory[];
  candidates: RecommendedEvent[];
}) => {
  const compactHistory = history.slice(0, 8).map((item) => ({
    category: item.category,
    tags: item.tags,
    soldPrice: item.soldPrice,
    purchasedAt: item.purchasedAt,
  }));

  const compactCandidates = candidates.slice(0, 8).map((event) => ({
    eventId: event.id,
    name: event.name,
    category: event.category,
    tags: event.tags,
    price: event.price,
    availableTickets: event.availableTickets,
    totalTickets: event.totalTickets,
    date: event.date,
    ruleScore: event.recommendationScore,
  }));

  return [
    "TicketMind icin kisa, guvenli ve aciklanabilir etkinlik onerileri uret.",
    "Kisisel veri yok; yalnizca anonim satin alma ozeti ve aday etkinlikler var.",
    "Cikti sadece JSON olsun. Markdown kullanma.",
    "Schema: {\"recommendations\":[{\"eventId\":\"...\",\"reason\":\"kisa Turkce neden\",\"signals\":[\"...\"],\"confidence\":0.0}]}",
    "En fazla 6 etkinlik dondur. confidence 0 ile 1 arasinda olsun.",
    JSON.stringify({ history: compactHistory, candidates: compactCandidates }),
  ].join("\n");
};

export const refineRecommendationsWithGemini = async ({
  history,
  candidates,
}: {
  history: TicketPurchaseHistory[];
  candidates: RecommendedEvent[];
}) => {
  if (!GEMINI_API_KEY || candidates.length === 0) {
    return undefined;
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt({ history, candidates }) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return undefined;
  }

  const parsed = safeJsonParse(text) as { recommendations?: GeminiRecommendation[] };
  const byId = new Map(candidates.map((event) => [event.id, event]));

  return (parsed.recommendations || [])
    .map((item): RecommendedEvent | undefined => {
      const event = byId.get(item.eventId);
      if (!event) return undefined;

      return {
        ...event,
        recommendationReason: item.reason || event.recommendationReason,
        recommendationSignals: item.signals?.length ? item.signals : event.recommendationSignals,
        aiConfidence: typeof item.confidence === "number" ? Math.min(0.99, Math.max(0.1, item.confidence)) : event.aiConfidence,
        aiProvider: "gemini" as const,
      };
    })
    .filter((event): event is RecommendedEvent => Boolean(event));
};
