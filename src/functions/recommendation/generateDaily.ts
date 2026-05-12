import { ScheduledEvent } from "aws-lambda";
import { putAiRecommendationCache } from "../../db/aiRecommendationRepository";
import { listAllEvents } from "../../db/eventRepository";
import { listAllPurchaseHistory } from "../../db/historyRepository";
import { refineRecommendationsWithGemini } from "../../services/geminiClient";
import { getPersonalizedRecommendations } from "../../services/recommendationService";
import { RecommendedEvent } from "../../types";

const groupHistoryByUser = (history: Awaited<ReturnType<typeof listAllPurchaseHistory>>) => {
  const grouped = new Map<string, typeof history>();

  history.forEach((item) => {
    if (!item.userId) return;
    const current = grouped.get(item.userId) || [];
    current.push(item);
    grouped.set(item.userId, current);
  });

  return grouped;
};

export const handler = async (_event: ScheduledEvent) => {
  const [events, allHistory] = await Promise.all([
    listAllEvents(),
    listAllPurchaseHistory(),
  ]);
  const historyByUser = groupHistoryByUser(allHistory);
  const generatedAt = new Date().toISOString();
  const results = [];

  for (const [userId, history] of historyByUser) {
    const ruleBasedRecommendations: RecommendedEvent[] = getPersonalizedRecommendations({
      events,
      history,
      limit: 6,
    }).map((event) => ({ ...event, aiProvider: "rule-based" as const }));

    let provider: "rule-based" | "gemini" = "rule-based";
    let recommendations: RecommendedEvent[] = ruleBasedRecommendations;

    try {
      const geminiRecommendations = await refineRecommendationsWithGemini({
        history,
        candidates: ruleBasedRecommendations,
      });

      if (geminiRecommendations?.length) {
        recommendations = geminiRecommendations;
        provider = "gemini";
      }
    } catch (error) {
      console.warn(`Gemini fallback used for user ${userId}`, error);
    }

    await putAiRecommendationCache({
      userId,
      recommendations,
      provider,
      generatedAt,
    });

    results.push({
      userId,
      provider,
      recommendations: recommendations.length,
    });
  }

  console.log("Daily AI recommendations generated", {
    users: results.length,
    generatedAt,
    results,
  });

  return {
    users: results.length,
    generatedAt,
    results,
  };
};
