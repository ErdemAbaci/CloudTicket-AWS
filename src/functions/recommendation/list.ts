import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getAiRecommendationCache } from "../../db/aiRecommendationRepository";
import { listAllEvents } from "../../db/eventRepository";
import { listPurchaseHistoryByUser } from "../../db/historyRepository";
import { getPersonalizedRecommendations } from "../../services/recommendationService";
import { getUserIdFromEvent } from "../../utils/auth";
import { formatResponse } from "../../utils/response";

const parseLimit = (limit?: string) => {
  if (!limit) {
    return undefined;
  }

  const parsed = Number(limit);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) return formatResponse(401, { error: "Kimlik doğrulanamadı" });
    const limit = parseLimit(event.queryStringParameters?.limit);
    const cached = await getAiRecommendationCache(userId);

    if (cached?.recommendations?.length) {
      return formatResponse(200, limit ? cached.recommendations.slice(0, limit) : cached.recommendations);
    }

    const [events, history] = await Promise.all([
      listAllEvents(),
      listPurchaseHistoryByUser(userId),
    ]);

    const recommendations = getPersonalizedRecommendations({
      events,
      history,
      limit,
    }).map((recommendation) => ({
      ...recommendation,
      aiProvider: "rule-based" as const,
    }));

    return formatResponse(200, recommendations);
  } catch (error) {
    console.error("Recommendation Error:", error);
    return formatResponse(500, { error: "Öneriler yüklenemedi" });
  }
};
