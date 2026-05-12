import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { AiRecommendationCache, RecommendedEvent } from "../types";

const TABLE_NAME = process.env.AI_RECOMMENDATIONS_TABLE || "";
const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

export const getAiRecommendationCache = async (userId: string) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId },
  }));

  return result.Item as AiRecommendationCache | undefined;
};

export const putAiRecommendationCache = async ({
  userId,
  recommendations,
  provider,
  generatedAt = new Date().toISOString(),
}: {
  userId: string;
  recommendations: RecommendedEvent[];
  provider: AiRecommendationCache["provider"];
  generatedAt?: string;
}) => {
  const expiresAt = Math.floor(Date.now() / 1000) + ONE_DAY_IN_SECONDS;

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      userId,
      generatedAt,
      expiresAt,
      provider,
      recommendations,
    },
  }));
};
