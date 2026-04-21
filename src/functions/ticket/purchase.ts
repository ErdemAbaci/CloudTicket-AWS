import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { decrementAvailableTickets } from "../../db/eventRepository";
import { publishTicketPurchased } from "../../services/eventService";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return formatResponse(400, { error: "Etkinlik ID gerekli" });

    // Cognito'dan kullanıcı bilgisini al (Cognito Authorizer kullanıldığı için garanti)
    const userId = event.requestContext.authorizer?.claims?.sub || event.requestContext.authorizer?.claims?.username || "anonymous";

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
    await publishTicketPurchased(id, userId);

    return formatResponse(200, {
      message: "Bilet başarıyla satın alındı/rezerve edildi!",
      eventId: id
    });
  } catch (error) {
    console.error("Purchase Error:", error);
    return formatResponse(500, { error: "Sunucu hatası" });
  }
};
