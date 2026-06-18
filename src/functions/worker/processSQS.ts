import { SQSEvent } from "aws-lambda";
import { createEventItem } from "../../db/eventRepository";
import { TicketEvent } from "../../types";

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      let eventData: TicketEvent;

      if (body.detail) {
        eventData = body.detail;
      } else {
        eventData = body as TicketEvent;
      }

      await createEventItem(eventData);
    } catch (error) {
      console.error("SQS event processing failed", {
        messageId: record.messageId,
        error,
      });
      throw error;
    }
  }
};
