import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalyticsOverview } from "../src/services/analyticsService";
import { TicketPurchaseHistory } from "../src/types";

const makeHistory = (overrides: Partial<TicketPurchaseHistory>): TicketPurchaseHistory => ({
  eventId: "event-1",
  userId: "user-1",
  purchasedAt: "2026-06-10T10:00:00.000Z",
  soldPrice: 500,
  basePrice: 600,
  category: "Konser",
  tags: ["rock"],
  totalCapacity: 100,
  remainingTickets: 40,
  ...overrides,
});

test("buildAnalyticsOverview aggregates revenue, volume and category stats", () => {
  const overview = buildAnalyticsOverview([
    makeHistory({ eventId: "event-1", soldPrice: 500, category: "Konser", purchasedAt: "2026-06-09T10:00:00.000Z" }),
    makeHistory({ eventId: "event-1", soldPrice: 700, category: "Konser", purchasedAt: "2026-06-10T10:00:00.000Z" }),
    makeHistory({ eventId: "event-2", soldPrice: 300, category: "Tiyatro", purchasedAt: "2026-06-10T12:00:00.000Z" }),
  ]);

  assert.equal(overview.totalRevenue, 1500);
  assert.equal(overview.soldTickets, 3);
  assert.equal(overview.averageTicketPrice, 500);
  assert.equal(overview.uniqueEventsSold, 2);
  assert.equal(overview.topCategory?.category, "Konser");
  assert.equal(overview.topCategory?.soldTickets, 2);
  assert.equal(overview.daily.length, 2);
  assert.equal(overview.topEvents[0].eventId, "event-1");
});
