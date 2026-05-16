import test from "node:test";
import assert from "node:assert/strict";
import {
  PURCHASE_MAX_ATTEMPTS,
  PURCHASE_WINDOW_SECONDS,
  evaluatePurchaseRateLimit,
  getPurchaseLimiterKeys,
} from "../src/services/purchaseRateLimitService";
import { PurchaseRateLimitRecord } from "../src/types";

const now = new Date("2026-05-16T12:00:00.000Z");

const makeRecord = (overrides: Partial<PurchaseRateLimitRecord> = {}): PurchaseRateLimitRecord => ({
  limiterKey: "user#user-1",
  attempts: 3,
  windowStartedAt: 1747396800,
  expiresAt: Math.floor(now.getTime() / 1000) + PURCHASE_WINDOW_SECONDS,
  updatedAt: now.toISOString(),
  ...overrides,
});

test("starts a fresh rate-limit window when no record exists", () => {
  const decision = evaluatePurchaseRateLimit({
    limiterKey: "user#user-1",
    now,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.nextRecord.attempts, 1);
});

test("blocks purchase attempts above the configured threshold", () => {
  const decision = evaluatePurchaseRateLimit({
    limiterKey: "user#user-1",
    current: makeRecord({ attempts: PURCHASE_MAX_ATTEMPTS }),
    now,
  });

  assert.equal(decision.allowed, false);
  assert.ok((decision.retryAfterSeconds || 0) >= 1);
});

test("resets the limiter after the window expires", () => {
  const decision = evaluatePurchaseRateLimit({
    limiterKey: "user#user-1",
    current: makeRecord({ attempts: PURCHASE_MAX_ATTEMPTS, expiresAt: Math.floor(now.getTime() / 1000) - 1 }),
    now,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.nextRecord.attempts, 1);
});

test("builds separate limiter keys for user and source ip", () => {
  const keys = getPurchaseLimiterKeys({
    requestContext: {
      identity: {
        sourceIp: "203.0.113.7",
      },
    },
  } as never, "user-1");

  assert.equal(keys.userLimiterKey, "user#user-1");
  assert.equal(keys.ipLimiterKey, "ip#203.0.113.7");
});
