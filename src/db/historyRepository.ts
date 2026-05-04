import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { TicketEvent } from "../types";

const HISTORY_TABLE = process.env.HISTORY_TABLE || "";

export const recordTicketPurchaseHistory = async ({
  eventData,
  userId,
  purchasedAt,
}: {
  eventData: TicketEvent;
  userId: string;
  purchasedAt: string;
}) => {
  await docClient.send(new PutCommand({
    TableName: HISTORY_TABLE,
    Item: {
      eventId: eventData.id,
      purchasedAt,
      userId,
      soldPrice: eventData.price,
      basePrice: eventData.basePrice || eventData.price,
      category: eventData.category || "Genel",
      tags: eventData.tags || [],
      totalCapacity: eventData.totalTickets,
      remainingTickets: eventData.availableTickets,
    },
  }));
};
