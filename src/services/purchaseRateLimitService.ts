import { APIGatewayProxyEvent } from "aws-lambda";
import { PurchaseRateLimitRecord } from "../types";

export const PURCHASE_WINDOW_SECONDS = 10;
export const PURCHASE_MAX_ATTEMPTS = 5;

export interface RateLimitDecision {
  allowed: boolean;
  nextRecord: PurchaseRateLimitRecord;
  retryAfterSeconds?: number;
}

const getNowInSeconds = (now: Date) => Math.floor(now.getTime() / 1000);

export const getPurchaseLimiterKeys = (event: APIGatewayProxyEvent, userId: string) => {
  const sourceIp = event.requestContext.identity?.sourceIp || "unknown-ip";

  return {
    userLimiterKey: `user#${userId}`,
    ipLimiterKey: `ip#${sourceIp}`,
    sourceIp,
  };
};

export const evaluatePurchaseRateLimit = ({
  current,
  limiterKey,
  now = new Date(),
}: {
  current?: PurchaseRateLimitRecord;
  limiterKey: string;
  now?: Date;
}): RateLimitDecision => {
  const nowInSeconds = getNowInSeconds(now);

  if (!current || current.expiresAt <= nowInSeconds) {
    return {
      allowed: true,
      nextRecord: {
        limiterKey,
        attempts: 1,
        windowStartedAt: nowInSeconds,
        expiresAt: nowInSeconds + PURCHASE_WINDOW_SECONDS,
        updatedAt: now.toISOString(),
      },
    };
  }

  const nextAttempts = current.attempts + 1;

  if (nextAttempts > PURCHASE_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, current.expiresAt - nowInSeconds),
      nextRecord: {
        ...current,
        attempts: nextAttempts,
        updatedAt: now.toISOString(),
      },
    };
  }

  return {
    allowed: true,
    nextRecord: {
      ...current,
      attempts: nextAttempts,
      updatedAt: now.toISOString(),
    },
  };
};
