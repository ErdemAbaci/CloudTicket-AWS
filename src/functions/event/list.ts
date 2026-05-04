import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { searchEvents } from "../../db/eventRepository";

const parseTags = (tags?: string) => {
  if (!tags) {
    return undefined;
  }

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const parseLimit = (limit?: string) => {
  if (!limit) {
    return undefined;
  }

  const parsed = Number(limit);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const params = event.queryStringParameters || {};
    const items = await searchEvents({
      search: params.search,
      category: params.category,
      tags: parseTags(params.tags),
      limit: parseLimit(params.limit),
    });

    return formatResponse(200, items);
  } catch (error) {
    console.error(error);
    return formatResponse(500, { error: "Hata" });
  }
};
