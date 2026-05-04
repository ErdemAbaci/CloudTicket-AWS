import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { listAllEvents } from "./eventRepository";
import { PricingDecision } from "../services/dynamicPricing";

const EVENTS_TABLE = process.env.EVENTS_TABLE || "";

export const listUpcomingEventsForPricing = async (now = new Date()) => {
  const events = await listAllEvents();
  const nowTime = now.getTime();

  return events.filter((event) => {
    const eventTime = new Date(event.date).getTime();
    return Number.isFinite(eventTime) && eventTime >= nowTime && event.availableTickets > 0;
  });
};

export const updateEventPrice = async (id: string, decision: PricingDecision, updatedAt: string) => {
  await docClient.send(new UpdateCommand({
    TableName: EVENTS_TABLE,
    Key: { id },
    UpdateExpression: [
      "SET price = :price",
      "basePrice = :basePrice",
      "minPrice = :minPrice",
      "maxPrice = :maxPrice",
      "lastPriceUpdateAt = :updatedAt",
      "pricingReason = :reason",
      "pricingTrend = :trend",
      "discountPercent = :discountPercent",
    ].join(", "),
    ExpressionAttributeValues: {
      ":price": decision.price,
      ":basePrice": decision.basePrice,
      ":minPrice": decision.minPrice,
      ":maxPrice": decision.maxPrice,
      ":updatedAt": updatedAt,
      ":reason": decision.pricingReason,
      ":trend": decision.pricingTrend,
      ":discountPercent": decision.discountPercent,
    },
  }));
};
