import { APIGatewayProxyEvent } from "aws-lambda";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://ticketmind.pages.dev",
];

export const getOriginHeader = (event?: APIGatewayProxyEvent): string => {
  if (!event || !event.headers) {
    return "https://ticketmind.pages.dev";
  }

  const origin = event.headers.origin || event.headers.Origin || "";

  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  return "https://ticketmind.pages.dev";
};

export const formatResponse = (statusCode: number, body: any, event?: APIGatewayProxyEvent) => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": getOriginHeader(event),
      "Access-Control-Allow-Credentials": true,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
};
