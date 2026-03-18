import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridgeClient } from "../db/client";
import { TicketEvent } from "../types";

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "";

export const publishTicketEvent = async (messageBody: TicketEvent) => {
  await eventBridgeClient.send(new PutEventsCommand({
    Entries: [
      {
        Source: "com.cloudticket",
        DetailType: "OrderCreated",
        Detail: JSON.stringify(messageBody),
        EventBusName: EVENT_BUS_NAME,
      },
    ],
  }));
};
