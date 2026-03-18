import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { listAllEvents } from "../../db/eventRepository";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const items = await listAllEvents();
    return formatResponse(200, items);
  } catch (error) {
    return formatResponse(500, { error: "Hata" });
  }
};
