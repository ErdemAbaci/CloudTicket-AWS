import { EventBridgeEvent } from "aws-lambda";
import { docClient } from "../../db/client";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { TicketPurchasedDetail } from "../../types";

const HISTORY_TABLE = process.env.HISTORY_TABLE || "";
const EVENTS_TABLE = process.env.EVENTS_TABLE || "";

export const handler = async (event: EventBridgeEvent<"TicketPurchased", TicketPurchasedDetail>) => {
  try {
    const { eventId, userId, purchasedAt } = event.detail;

    // Analitik için etkinliğin o anki durumunu alalım (örn: Satıldığı andaki fiyat)
    const eventResult = await docClient.send(new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId }
    }));
    
    const eventData = eventResult.Item;
    if (!eventData) {
      console.warn(`Etkinlik bulunamadı: ${eventId}, analitik kaydı eksik olabilir.`);
      return;
    }

    // AI modelinin eğitimi için veriyi düzleştiriyoruz (Flattening)
    await docClient.send(new PutCommand({
      TableName: HISTORY_TABLE,
      Item: {
        eventId,
        purchasedAt,
        userId,
        soldPrice: eventData.price, // Satış anındaki fiyat (Dinamik fiyatlandırma etkisini görmek için)
        basePrice: eventData.basePrice || eventData.price,
        category: eventData.category || "Genel",
        tags: eventData.tags || [],
        totalCapacity: eventData.totalTickets,
        remainingTickets: eventData.availableTickets // Bilet alındıktan sonra kalan stok durumu
      }
    }));

    console.log(`Analitik kaydedildi -> Etkinlik: ${eventId}, Fiyat: ${eventData.price}`);
  } catch (error) {
    console.error("Analitik kaydetme hatası:", error);
    // Analitik hataları uygulamanın akışını bozmamalı, sadece logluyoruz.
  }
};
