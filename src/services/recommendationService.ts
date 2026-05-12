import { RecommendedEvent, TicketEvent, TicketPurchaseHistory } from "../types";

const DEFAULT_RECOMMENDATION_LIMIT = 6;
const MAX_RECOMMENDATION_LIMIT = 12;

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const parseLimit = (limit?: number) => {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_RECOMMENDATION_LIMIT;
  }

  return Math.min(MAX_RECOMMENDATION_LIMIT, Math.max(1, Math.floor(limit)));
};

const isUpcomingAndAvailable = (event: TicketEvent, now: Date) => {
  const eventTime = new Date(event.date).getTime();
  return Number.isFinite(eventTime) && eventTime >= now.getTime() && event.availableTickets > 0;
};

const increment = (map: Map<string, number>, key?: string, value = 1) => {
  if (!key) return;
  const normalizedKey = normalizeText(key);
  map.set(normalizedKey, (map.get(normalizedKey) || 0) + value);
};

const getMatchedTags = (event: TicketEvent, tagWeights: Map<string, number>) => {
  return (event.tags || []).filter((tag) => tagWeights.has(normalizeText(tag)));
};

const getAverageSoldPrice = (history: TicketPurchaseHistory[]) => {
  if (!history.length) {
    return 0;
  }

  const total = history.reduce((sum, item) => sum + (item.soldPrice || 0), 0);
  return total / history.length;
};

const getPriceBandSignal = (event: TicketEvent, averageSoldPrice: number) => {
  if (!averageSoldPrice) {
    return undefined;
  }

  const lowerBound = averageSoldPrice * 0.75;
  const upperBound = averageSoldPrice * 1.25;

  if (event.price >= lowerBound && event.price <= upperBound) {
    return "Geçmiş fiyat aralığına yakın";
  }

  if (event.price < lowerBound) {
    return "Geçmiş seçimlerine göre daha uygun fiyatlı";
  }

  return undefined;
};

const getScarcitySignal = (event: TicketEvent) => {
  if (!event.totalTickets || event.availableTickets <= 0) {
    return undefined;
  }

  const remainingRatio = event.availableTickets / event.totalTickets;
  return remainingRatio <= 0.25 ? "Kalan bilet oranı düşük" : undefined;
};

const getAiConfidence = ({
  historySize,
  categoryScore,
  matchedTags,
  priceSignal,
}: {
  historySize: number;
  categoryScore: number;
  matchedTags: string[];
  priceSignal?: string;
}) => {
  if (!historySize) {
    return 0.35;
  }

  const historyBoost = Math.min(historySize, 5) * 0.08;
  const categoryBoost = categoryScore > 0 ? 0.12 : 0;
  const tagBoost = Math.min(matchedTags.length, 3) * 0.07;
  const priceBoost = priceSignal ? 0.05 : 0;

  return Math.min(0.95, Number((0.45 + historyBoost + categoryBoost + tagBoost + priceBoost).toFixed(2)));
};

const getRecommendationSignals = ({
  event,
  matchedTags,
  categoryScore,
  priceSignal,
}: {
  event: TicketEvent;
  matchedTags: string[];
  categoryScore: number;
  priceSignal?: string;
}) => {
  return [
    categoryScore > 0 ? `${event.category || "Genel"} kategorisi geçmişinle eşleşti` : undefined,
    ...matchedTags.slice(0, 3).map((tag) => `#${tag} etiketi ilgi alanında`),
    priceSignal,
    getScarcitySignal(event),
  ].filter((signal): signal is string => Boolean(signal));
};

const getRecommendationReason = ({
  event,
  matchedTags,
  categoryScore,
}: {
  event: TicketEvent;
  matchedTags: string[];
  categoryScore: number;
}) => {
  if (matchedTags.length) {
    return `Daha önce ilgilendiğin #${matchedTags[0]} etiketine yakın`;
  }

  if (categoryScore > 0) {
    return `${event.category || "Genel"} kategorisindeki geçmiş seçimlerine uygun`;
  }

  return "Yaklaşan ve satışa açık etkinlik";
};

export const getPersonalizedRecommendations = ({
  events,
  history,
  limit,
  now = new Date(),
}: {
  events: TicketEvent[];
  history: TicketPurchaseHistory[];
  limit?: number;
  now?: Date;
}): RecommendedEvent[] => {
  const resultLimit = parseLimit(limit);
  const purchasedEventIds = new Set(history.map((item) => item.eventId));
  const categoryWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const averageSoldPrice = getAverageSoldPrice(history);

  history.forEach((item, index) => {
    const recencyBoost = Math.max(1, 4 - index);
    increment(categoryWeights, item.category, recencyBoost * 2);
    (item.tags || []).forEach((tag) => increment(tagWeights, tag, recencyBoost));
  });

  const candidates = events
    .filter((event) => isUpcomingAndAvailable(event, now))
    .filter((event) => !purchasedEventIds.has(event.id));

  return candidates
    .map((event) => {
      const normalizedCategory = normalizeText(event.category || "Genel");
      const categoryScore = categoryWeights.get(normalizedCategory) || 0;
      const matchedTags = getMatchedTags(event, tagWeights);
      const tagScore = matchedTags.reduce((score, tag) => score + (tagWeights.get(normalizeText(tag)) || 0), 0);
      const priceSignal = getPriceBandSignal(event, averageSoldPrice);
      const scarcityBoost = event.totalTickets > 0
        ? Math.max(0, 1 - event.availableTickets / event.totalTickets)
        : 0;
      const recommendationScore = history.length
        ? categoryScore + tagScore + scarcityBoost
        : scarcityBoost;

      return {
        ...event,
        recommendationScore,
        recommendationReason: getRecommendationReason({ event, matchedTags, categoryScore }),
        recommendationSignals: getRecommendationSignals({ event, matchedTags, categoryScore, priceSignal }),
        aiConfidence: getAiConfidence({
          historySize: history.length,
          categoryScore,
          matchedTags,
          priceSignal,
        }),
      };
    })
    .sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }

      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, resultLimit);
};
