import { APIGatewayProxyEvent } from "aws-lambda";

export const getUserIdFromEvent = (event: APIGatewayProxyEvent) => {
  return event.requestContext.authorizer?.claims?.sub
    || event.requestContext.authorizer?.claims?.username
    || null;
};
