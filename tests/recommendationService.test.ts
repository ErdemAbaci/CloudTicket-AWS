import test from "node:test";
import assert from "node:assert/strict";
import { getPersonalizedRecommendations } from "../src/services/recommendationService";
import { TicketEvent, TicketPurchaseHistory } from "../src/types";

const now = new Date("2026-05-12T00:00:00.000Z");

const makeEvent = (overrides: Partial<TicketEvent>): TicketEvent => ({
  id: "event-1",
  name: "Test Etkinlik",
  date: "2026-05-20T00:00:00.000Z",
  price: 100,
  basePrice: 100,
  totalTickets: 100,
  availableTickets: 60,
  category: "Konser",
  tags: [],
  createdAt: now.toISOString(),
  ...overrides,
});

const makeHistory = (overrides: Partial<TicketPurchaseHistory>): TicketPurchaseHistory => ({
  eventId: "old-event",
  userId: "user-1",
  purchasedAt: "2026-05-01T00:00:00.000Z",
  soldPrice: 100,
  basePrice: 100,
  category: "Konser",
  tags: ["rock"],
  totalCapacity: 100,
  remainingTickets: 50,
  ...overrides,
});

test("scores matching category and tags higher than unrelated events", () => {
  const recommendations = getPersonalizedRecommendations({
    events: [
      makeEvent({ id: "rock-event", tags: ["rock"], category: "Konser" }),
      makeEvent({ id: "sport-event", tags: ["futbol"], category: "Spor" }),
    ],
    history: [makeHistory({})],
    now,
  });

  assert.equal(recommendations[0].id, "rock-event");
  assert.match(recommendations[0].recommendationReason, /rock/);
  assert.ok((recommendations[0].aiConfidence || 0) > 0.5);
  assert.ok(recommendations[0].recommendationSignals?.some((signal) => signal.includes("Konser")));
});

test("excludes events the user already purchased", () => {
  const recommendations = getPersonalizedRecommendations({
    events: [
      makeEvent({ id: "old-event", tags: ["rock"], category: "Konser" }),
      makeEvent({ id: "new-event", tags: ["rock"], category: "Konser" }),
    ],
    history: [makeHistory({ eventId: "old-event" })],
    now,
  });

  assert.deepEqual(recommendations.map((event) => event.id), ["new-event"]);
});

test("falls back to upcoming available events without history", () => {
  const recommendations = getPersonalizedRecommendations({
    events: [
      makeEvent({ id: "past-event", date: "2026-05-01T00:00:00.000Z" }),
      makeEvent({ id: "sold-out-event", availableTickets: 0 }),
      makeEvent({ id: "available-event", availableTickets: 30 }),
    ],
    history: [],
    now,
  });

  assert.deepEqual(recommendations.map((event) => event.id), ["available-event"]);
  assert.equal(recommendations[0].recommendationReason, "Yaklaşan ve satışa açık etkinlik");
});
