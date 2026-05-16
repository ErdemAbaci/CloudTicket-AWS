import { APIGatewayProxyEvent } from "aws-lambda";
import {
  getPurchaseRateLimitRecord,
  incrementPurchaseRateLimitRecord,
  putFreshPurchaseRateLimitRecord,
} from "../db/purchaseRateLimitRepository";
import {
  evaluatePurchaseRateLimit,
  getPurchaseLimiterKeys,
} from "./purchaseRateLimitService";

const MAX_WRITE_RETRIES = 3;

const persistRateLimitDecision = async (limiterKey: string, now: Date) => {
  for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt += 1) {
    const current = await getPurchaseRateLimitRecord(limiterKey);
    const decision = evaluatePurchaseRateLimit({ current, limiterKey, now });

    if (!decision.allowed) {
      return decision;
    }

    const nowInSeconds = Math.floor(now.getTime() / 1000);
    const didPersist = current
      ? await incrementPurchaseRateLimitRecord({
          record: decision.nextRecord,
          expectedAttempts: current.attempts,
          expectedExpiresAt: current.expiresAt,
        })
      : await putFreshPurchaseRateLimitRecord(decision.nextRecord, nowInSeconds);

    if (didPersist) {
      return decision;
    }
  }

  throw new Error(`Purchase rate limit write failed for ${limiterKey}`);
};

export const guardPurchaseAttempt = async ({
  event,
  userId,
  now = new Date(),
}: {
  event: APIGatewayProxyEvent;
  userId: string;
  now?: Date;
}) => {
  const { userLimiterKey, ipLimiterKey, sourceIp } = getPurchaseLimiterKeys(event, userId);

  const ipDecision = await persistRateLimitDecision(ipLimiterKey, now);
  if (!ipDecision.allowed) {
    return {
      allowed: false,
      scope: "ip" as const,
      sourceIp,
      retryAfterSeconds: ipDecision.retryAfterSeconds || 1,
    };
  }

  const userDecision = await persistRateLimitDecision(userLimiterKey, now);
  if (!userDecision.allowed) {
    return {
      allowed: false,
      scope: "user" as const,
      sourceIp,
      retryAfterSeconds: userDecision.retryAfterSeconds || 1,
    };
  }

  return {
    allowed: true,
    sourceIp,
  };
};
