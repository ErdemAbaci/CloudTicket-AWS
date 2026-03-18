import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";
import { formatResponse } from "../../utils/response";
import { publishTicketEvent } from "../../services/eventService";
import { TicketEvent } from "../../types";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return formatResponse(400, { error: "Body eksik" });
    }

    const body = JSON.parse(event.body) as Partial<TicketEvent>;

    if (!body.name || !body.price) {
      return formatResponse(400, { error: "İsim ve Fiyat zorunludur" });
    }

    const eventId = randomUUID();

    const messageBody: TicketEvent = {
      id: eventId,
      name: body.name,
      date: body.date || new Date().toISOString(),
      price: body.price,
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString()
    };

    await publishTicketEvent(messageBody);

    return formatResponse(202, {
      message: "İsteğiniz kuyruğa alındı.",
      id: eventId
    });
  } catch (error) {
    console.error(error);
    return formatResponse(500, { error: "Sunucu hatası" });
  }
};
