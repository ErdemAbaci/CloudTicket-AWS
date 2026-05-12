import { ScheduledEvent } from "aws-lambda";
import { listUpcomingEventsForPricing, updateEventPrice } from "../../db/pricingRepository";
import { calculateDynamicPrice } from "../../services/dynamicPricing";
import { refineRecommendationsWithGemini } from "../../services/geminiClient";

export const handler = async (_event: ScheduledEvent) => {
  const now = new Date();
  const updatedAt = now.toISOString();
  const events = await listUpcomingEventsForPricing(now);

  const results = await Promise.all(events.map(async (ticketEvent) => {
    const decision = calculateDynamicPrice(ticketEvent, now);
    let pricingReason = decision.pricingReason;

    try {
      const geminiExplanation = await refineRecommendationsWithGemini({
        history: [],
        candidates: [{
          ...ticketEvent,
          recommendationScore: 1,
          recommendationReason: decision.pricingReason,
          recommendationSignals: [
            `Güncel fiyat: ${decision.price}`,
            `Trend: ${decision.pricingTrend}`,
            `Kalan bilet: ${ticketEvent.availableTickets}`,
          ],
          aiConfidence: 0.5,
          aiProvider: "rule-based",
        }],
      });

      if (geminiExplanation?.[0]?.recommendationReason) {
        pricingReason = geminiExplanation[0].recommendationReason;
      }
    } catch {
      // Gemini opsiyonel; fiyat kararını deterministic motor verir.
    }

    const enrichedDecision = {
      ...decision,
      pricingReason,
    };
    await updateEventPrice(ticketEvent.id, enrichedDecision, updatedAt);

    return {
      eventId: ticketEvent.id,
      oldPrice: ticketEvent.price,
      newPrice: enrichedDecision.price,
      trend: enrichedDecision.pricingTrend,
      reason: enrichedDecision.pricingReason,
    };
  }));

  console.log("Dynamic pricing completed", {
    checkedEvents: events.length,
    updatedEvents: results.length,
    updatedAt,
    results,
  });

  return {
    checkedEvents: events.length,
    updatedEvents: results.length,
    updatedAt,
  };
};
