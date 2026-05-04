import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";

const TICKETS_TABLE = process.env.TICKETS_TABLE || "";

export interface TicketRecord {
  userId: string;
  ticketId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  purchasedAt: string;
  qrUrl: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
}

export const createTicketRecord = async (ticket: TicketRecord) => {
  await docClient.send(new PutCommand({
    TableName: TICKETS_TABLE,
    Item: ticket,
  }));
};

export const listTicketsByUser = async (userId: string) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TICKETS_TABLE,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  }));

  return result.Items || [];
};
