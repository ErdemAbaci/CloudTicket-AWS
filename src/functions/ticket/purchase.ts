import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { decrementAvailableTickets, getEventById } from "../../db/eventRepository";
import { publishTicketPurchased } from "../../services/eventService";
import { getUserIdFromEvent } from "../../utils/auth";
import { guardPurchaseAttempt } from "../../services/purchaseGuardService";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return formatResponse(400, { error: "Etkinlik ID gerekli" });

    const userId = getUserIdFromEvent(event);
    if (!userId) return formatResponse(401, { error: "Kimlik doğrulanamadı" });
    const guardResult = await guardPurchaseAttempt({ event, userId });

    if (!guardResult.allowed) {
      const response = formatResponse(429, {
        error: "Çok sık bilet alma denemesi algılandı. Lütfen kısa bir süre sonra tekrar dene.",
        scope: guardResult.scope,
        retryAfterSeconds: guardResult.retryAfterSeconds,
      });

      return {
        ...response,
        headers: {
          ...response.headers,
          "Retry-After": String(guardResult.retryAfterSeconds),
        },
      };
    }

    // Atomic kilit mekanizması
    try {
      await decrementAvailableTickets(id);
    } catch (dbError: any) {
      if (dbError.name === "ConditionalCheckFailedException") {
        return formatResponse(400, { error: "Üzgünüz, bu etkinlik için biletler tamamen tükendi veya yeterli stok yok!" });
      }
      throw dbError; // Diğer hatalar için dış catch bloğuna fırlat
    }

    // Bilet garantilendi! Anlık fiyatı kaydet ve EventBridge'ye fırlat
    const eventData = await getEventById(id);
    const soldPrice = eventData?.price ?? 0;
    await publishTicketPurchased(id, userId, soldPrice);

    return formatResponse(200, {
      message: "Bilet başarıyla satın alındı/rezerve edildi!",
      eventId: id
    });
  } catch (error) {
    console.error("Purchase Error:", error);
    return formatResponse(500, { error: "Sunucu hatası" });
  }
};
