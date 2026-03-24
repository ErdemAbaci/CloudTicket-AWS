import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { decrementAvailableTickets } from "../../db/eventRepository";
import { publishTicketPurchased } from "../../services/eventService";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return formatResponse(400, { error: "Etkinlik ID gerekli" });

    // Atomic kilit mekanizması
    try {
      await decrementAvailableTickets(id);
    } catch (dbError: any) {
      if (dbError.name === "ConditionalCheckFailedException") {
        return formatResponse(400, { error: "Üzgünüz, bu etkinlik için biletler tamamen tükendi veya yeterli stok yok!" });
      }
      throw dbError; // Diğer hatalar için dış catch bloğuna fırlat
    }

    // Bilet garantilendi! EventBridge'ye satın alım olayını fırlat (Asenkron - beklememize gerek yok)
    await publishTicketPurchased(id);

    return formatResponse(200, {
      message: "Bilet başarıyla satın alındı/rezerve edildi!",
      eventId: id
    });
  } catch (error) {
    console.error("Purchase Error:", error);
    return formatResponse(500, { error: "Sunucu hatası" });
  }
};
