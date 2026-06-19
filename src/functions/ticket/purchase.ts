import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { decrementAvailableTickets, getEventById, isUpcomingEvent } from "../../db/eventRepository";
import { publishTicketPurchased } from "../../services/eventService";
import { getUserIdFromEvent } from "../../utils/auth";
import { guardPurchaseAttempt } from "../../services/purchaseGuardService";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return formatResponse(400, { error: "Etkinlik ID gerekli" }, event);

    const userId = getUserIdFromEvent(event);
    if (!userId) return formatResponse(401, { error: "Kimlik doğrulanamadı" }, event);

    const eventData = await getEventById(id);
    if (!eventData) {
      return formatResponse(404, { error: "Etkinlik bulunamadı" }, event);
    }

    if (!isUpcomingEvent(eventData)) {
      return formatResponse(400, { error: "Bu etkinliğin tarihi geçtiği için bilet satışı kapalı." }, event);
    }

    const guardResult = await guardPurchaseAttempt({ event, userId });

    if (!guardResult.allowed) {
      const response = formatResponse(429, {
        error: "Çok sık bilet alma denemesi algılandı. Lütfen kısa bir süre sonra tekrar dene.",
        scope: guardResult.scope,
        retryAfterSeconds: guardResult.retryAfterSeconds,
      }, event);

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
        return formatResponse(400, { error: "Üzgünüz, bu etkinlik için biletler tamamen tükendi veya yeterli stok yok!" }, event);
      }
      throw dbError; // Diğer hatalar için dış catch bloğuna fırlat
    }

    // Bilet garantilendi! Anlık fiyatı kaydet ve EventBridge'ye fırlat
    await publishTicketPurchased(id, userId, eventData.price);

    return formatResponse(200, {
      message: "Bilet başarıyla satın alındı/rezerve edildi!",
      eventId: id
    }, event);
  } catch (error) {
    console.error("Purchase Error:", error);
    return formatResponse(500, { error: "Sunucu hatası" }, event);
  }
};
