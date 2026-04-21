import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatResponse } from "../../utils/response";
import { docClient } from "../../db/client";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

const TICKETS_TABLE = process.env.TICKETS_TABLE || "";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub || event.requestContext.authorizer?.claims?.username;

    if (!userId) {
      return formatResponse(401, { error: "Kimlik doğrulanamadı" });
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TICKETS_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    }));

    // İstenirse her bilet için events tablosuna bakılıp etkinlik adı (name) çekilebilir 
    // veya doğrudan etkinlik adı purchase sırasında buraya da kopyalanabilir. (Denormalizasyon)
    
    return formatResponse(200, result.Items || []);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return formatResponse(500, { error: "Sunucu hatası" });
  }
};
