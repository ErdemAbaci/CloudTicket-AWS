import { SQSEvent } from "aws-lambda";
import { createEventItem } from "../../db/eventRepository";
import { TicketEvent } from "../../types";

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      console.log("İşleniyor (Ham):", record.body);

      const body = JSON.parse(record.body);
      let eventData: TicketEvent;

      if (body.detail) {
        console.log("EventBridge Envelope detected, unwrapping...");
        eventData = body.detail;
      } else {
        console.log("Direct payload detected.");
        eventData = body as TicketEvent;
      }

      await createEventItem(eventData);

    } catch (error) {
      console.error("Hata:", error);
    }
  }
};
