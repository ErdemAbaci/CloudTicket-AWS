import { EventBridgeEvent } from "aws-lambda";
import { TicketPurchasedDetail } from "../../types";
import { getEventById } from "../../db/eventRepository";
import { recordTicketPurchaseHistory } from "../../db/historyRepository";

export const handler = async (event: EventBridgeEvent<"TicketPurchased", TicketPurchasedDetail>) => {
  try {
    const { eventId, userId, purchasedAt } = event.detail;

    const eventData = await getEventById(eventId);
    if (!eventData) {
      console.warn(`Etkinlik bulunamadı: ${eventId}, analitik kaydı eksik olabilir.`);
      return;
    }

    await recordTicketPurchaseHistory({ eventData, userId, purchasedAt });

    console.log(`Analitik kaydedildi -> Etkinlik: ${eventId}, Fiyat: ${eventData.price}`);
  } catch (error) {
    console.error("Analitik kaydetme hatası:", error);
    // Analitik hataları uygulamanın akışını bozmamalı, sadece logluyoruz.
  }
};
