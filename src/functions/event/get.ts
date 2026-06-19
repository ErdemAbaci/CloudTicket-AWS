import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { getEventById } from "../../db/eventRepository";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return formatResponse(400, "ID gerekli", event);

    const item = await getEventById(id);
    if (!item) return formatResponse(404, { error: "Bulunamadı" }, event);

    return formatResponse(200, item, event);
  } catch (error) {
    return formatResponse(500, { error: "Hata" }, event);
  }
};
