import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridgeClient } from "../db/client";
import { TicketEvent } from "../types";
import { EVENT_DETAIL_TYPES, EVENT_SOURCE } from "../constants/events";

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "";

export const publishTicketEvent = async (messageBody: TicketEvent) => {
  await eventBridgeClient.send(new PutEventsCommand({
    Entries: [
      {
        Source: EVENT_SOURCE,
        DetailType: EVENT_DETAIL_TYPES.orderCreated,
        Detail: JSON.stringify(messageBody),
        EventBusName: EVENT_BUS_NAME,
      },
    ],
  }));
};

export const publishTicketPurchased = async (eventId: string, userId: string) => {
  await eventBridgeClient.send(new PutEventsCommand({
    Entries: [
      {
        Source: EVENT_SOURCE,
        DetailType: EVENT_DETAIL_TYPES.ticketPurchased,
        Detail: JSON.stringify({ eventId, userId, purchasedAt: new Date().toISOString() }),
        EventBusName: EVENT_BUS_NAME,
      },
    ],
  }));
};
