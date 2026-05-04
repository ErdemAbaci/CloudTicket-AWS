import test from "node:test";
import assert from "node:assert/strict";
import { calculateDynamicPrice } from "../src/services/dynamicPricing";
import { TicketEvent } from "../src/types";

const now = new Date("2026-05-04T00:00:00.000Z");

const makeEvent = (overrides: Partial<TicketEvent> = {}): TicketEvent => ({
  id: "event-1",
  name: "Test Konseri",
  date: "2026-05-14T00:00:00.000Z",
  price: 100,
  basePrice: 100,
  totalTickets: 100,
  availableTickets: 50,
  category: "Konser",
  tags: [],
  createdAt: now.toISOString(),
  ...overrides,
});

test("high demand raises price within daily movement limit", () => {
  const decision = calculateDynamicPrice(makeEvent({ availableTickets: 10 }), now);

  assert.equal(decision.price, 115);
  assert.equal(decision.pricingTrend, "surge");
  assert.equal(decision.discountPercent, 0);
});

test("low demand close to event applies discount", () => {
  const decision = calculateDynamicPrice(makeEvent({
    date: "2026-05-09T00:00:00.000Z",
    availableTickets: 90,
  }), now);

  assert.equal(decision.price, 90);
  assert.equal(decision.pricingTrend, "discount");
  assert.equal(decision.discountPercent, 10);
});

test("minimum price prevents excessive discounts", () => {
  const decision = calculateDynamicPrice(makeEvent({
    date: "2026-05-09T00:00:00.000Z",
    availableTickets: 90,
    minPrice: 95,
  }), now);

  assert.equal(decision.price, 95);
  assert.equal(decision.pricingTrend, "discount");
  assert.equal(decision.discountPercent, 5);
});

test("maximum price caps high demand increases", () => {
  const decision = calculateDynamicPrice(makeEvent({
    availableTickets: 10,
    maxPrice: 110,
  }), now);

  assert.equal(decision.price, 110);
  assert.equal(decision.pricingTrend, "surge");
});

test("balanced demand keeps price stable", () => {
  const decision = calculateDynamicPrice(makeEvent({
    date: "2026-06-10T00:00:00.000Z",
    availableTickets: 50,
  }), now);

  assert.equal(decision.price, 100);
  assert.equal(decision.pricingTrend, "stable");
});
