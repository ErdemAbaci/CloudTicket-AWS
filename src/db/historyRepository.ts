import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { TicketEvent, TicketPurchaseHistory } from "../types";

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

export const listPurchaseHistoryByUser = async (userId: string) => {
  const items: TicketPurchaseHistory[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(new ScanCommand({
      TableName: HISTORY_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ExclusiveStartKey,
    }));

    items.push(...((result.Items || []) as TicketPurchaseHistory[]));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
};

export const listAllPurchaseHistory = async () => {
  const items: TicketPurchaseHistory[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(new ScanCommand({
      TableName: HISTORY_TABLE,
      ExclusiveStartKey,
    }));

    items.push(...((result.Items || []) as TicketPurchaseHistory[]));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
};
