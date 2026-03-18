import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { getEventById } from "../../db/eventRepository";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return formatResponse(400, "ID gerekli");

    const item = await getEventById(id);
    if (!item) return formatResponse(404, { error: "Bulunamadı" });

    return formatResponse(200, item);
  } catch (error) {
    return formatResponse(500, { error: "Hata" });
  }
};
