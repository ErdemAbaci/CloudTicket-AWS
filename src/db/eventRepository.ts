import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { TicketEvent } from "../types";

const TABLE_NAME = process.env.EVENTS_TABLE || "";

export const createEventItem = async (eventData: TicketEvent) => {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: eventData,
  }));
};

export const listAllEvents = async () => {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return result.Items || [];
};

export const getEventById = async (id: string) => {
  const result = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
  return result.Item;
};

export const decrementAvailableTickets = async (id: string) => {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: "SET availableTickets = availableTickets - :dec",
    ConditionExpression: "availableTickets >= :dec", // Stok 1 veya fazlaysa düş
    ExpressionAttributeValues: {
      ":dec": 1
    }
  }));
};
