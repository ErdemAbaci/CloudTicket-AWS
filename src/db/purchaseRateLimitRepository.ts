import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { PurchaseRateLimitRecord } from "../types";

const TABLE_NAME = process.env.PURCHASE_RATE_LIMITS_TABLE || "";

export const getPurchaseRateLimitRecord = async (limiterKey: string) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { limiterKey },
  }));

  return result.Item as PurchaseRateLimitRecord | undefined;
};

export const putFreshPurchaseRateLimitRecord = async (record: PurchaseRateLimitRecord, nowInSeconds: number) => {
  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
      ConditionExpression: "attribute_not_exists(limiterKey) OR expiresAt <= :now",
      ExpressionAttributeValues: {
        ":now": nowInSeconds,
      },
    }));

    return true;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return false;
    }

    throw error;
  }
};

export const incrementPurchaseRateLimitRecord = async ({
  record,
  expectedAttempts,
  expectedExpiresAt,
}: {
  record: PurchaseRateLimitRecord;
  expectedAttempts: number;
  expectedExpiresAt: number;
}) => {
  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { limiterKey: record.limiterKey },
      UpdateExpression: "SET attempts = :attempts, updatedAt = :updatedAt",
      ConditionExpression: "attempts = :expectedAttempts AND expiresAt = :expectedExpiresAt",
      ExpressionAttributeValues: {
        ":attempts": record.attempts,
        ":updatedAt": record.updatedAt,
        ":expectedAttempts": expectedAttempts,
        ":expectedExpiresAt": expectedExpiresAt,
      },
    }));

    return true;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return false;
    }

    throw error;
  }
};
