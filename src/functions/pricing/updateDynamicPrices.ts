import { ScheduledEvent } from "aws-lambda";
import { listUpcomingEventsForPricing, updateEventPrice } from "../../db/eventRepository";
import { calculateDynamicPrice } from "../../services/dynamicPricing";

export const handler = async (_event: ScheduledEvent) => {
  const now = new Date();
  const updatedAt = now.toISOString();
  const events = await listUpcomingEventsForPricing(now);

  const results = await Promise.all(events.map(async (ticketEvent) => {
    const decision = calculateDynamicPrice(ticketEvent, now);
    await updateEventPrice(ticketEvent.id, decision, updatedAt);

    return {
      eventId: ticketEvent.id,
      oldPrice: ticketEvent.price,
      newPrice: decision.price,
      trend: decision.pricingTrend,
      reason: decision.pricingReason,
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
