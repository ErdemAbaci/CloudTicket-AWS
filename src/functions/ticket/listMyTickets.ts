import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { listTicketsByUser } from "../../db/ticketRepository";
import { getUserIdFromEvent } from "../../utils/auth";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);

    if (!userId) {
      return formatResponse(401, { error: "Kimlik doğrulanamadı" });
    }

    const tickets = await listTicketsByUser(userId);
    return formatResponse(200, tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return formatResponse(500, { error: "Sunucu hatası" });
  }
};
