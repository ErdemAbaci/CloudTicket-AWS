import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const eventsTable = args.get("--events-table") || process.env.EVENTS_TABLE;
const historyTable = args.get("--history-table") || process.env.HISTORY_TABLE;
const region = args.get("--region") || process.env.AWS_REGION || "eu-central-1";
const userId = args.get("--user-id") || process.env.DEMO_USER_ID;
const seedHistory = !process.argv.includes("--events-only");

if (!eventsTable) {
  console.error("Usage: node scripts/seedDemoShowcase.mjs --events-table <eventsTable> [--history-table <historyTable>] [--user-id <userId>] [--events-only]");
  process.exit(1);
}

if (seedHistory && !historyTable) {
  console.error("History seeding icin --history-table veya HISTORY_TABLE gerekli.");
  process.exit(1);
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const normalizeSearchText = (...values) =>
  values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const now = new Date();
const futureDate = (days, hour) => {
  const value = new Date(now);
  value.setUTCDate(value.getUTCDate() + days);
  value.setUTCHours(hour, 0, 0, 0);
  return value.toISOString();
};

const events = [
  {
    id: "demo-neo-jazz-istanbul",
    name: "Neo Jazz Istanbul",
    date: futureDate(5, 18),
    price: 790,
    basePrice: 990,
    totalTickets: 240,
    availableTickets: 74,
    category: "Konser",
    tags: ["jazz", "aksam", "acikhava"],
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-night-run-bosphorus",
    name: "Bosphorus Night Run",
    date: futureDate(9, 17),
    price: 520,
    basePrice: 520,
    totalTickets: 500,
    availableTickets: 182,
    category: "Spor",
    tags: ["kosu", "acikhava", "gece"],
    imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-digital-futures-fest",
    name: "Digital Futures Fest",
    date: futureDate(14, 11),
    price: 1250,
    basePrice: 1490,
    totalTickets: 900,
    availableTickets: 320,
    category: "Festival",
    tags: ["teknoloji", "yaraticilik", "network"],
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-late-show-standup",
    name: "Late Show Stand-up Club",
    date: futureDate(3, 19),
    price: 340,
    basePrice: 390,
    totalTickets: 180,
    availableTickets: 28,
    category: "Stand-up",
    tags: ["komedi", "kulup", "haftasonu"],
    imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-romeo-juliet-stage",
    name: "Romeo ve Juliet Sahne Yorumu",
    date: futureDate(11, 17),
    price: 610,
    basePrice: 610,
    totalTickets: 260,
    availableTickets: 116,
    category: "Tiyatro",
    tags: ["drama", "sahne", "klasik"],
    imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-synthwave-sunset",
    name: "Synthwave Sunset Session",
    date: futureDate(7, 18),
    price: 880,
    basePrice: 760,
    totalTickets: 300,
    availableTickets: 34,
    category: "Konser",
    tags: ["elektronik", "sunset", "dj"],
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
  },
];

const addComputedFields = (event) => {
  const discountPercent = event.basePrice > event.price
    ? Math.round(((event.basePrice - event.price) / event.basePrice) * 100)
    : 0;

  return {
    ...event,
    minPrice: Math.round(event.basePrice * 0.75),
    maxPrice: Math.round(event.basePrice * 1.4),
    pricingTrend: event.price < event.basePrice ? "discount" : event.price > event.basePrice ? "surge" : "stable",
    discountPercent,
    pricingReason: event.price < event.basePrice
      ? "Talep dengesi ve etkinlik tarihine gore avantajli fiyat"
      : event.price > event.basePrice
        ? "Yuksek talep nedeniyle fiyat guncellendi"
        : "Standart fiyat korunuyor",
    lastPriceUpdateAt: now.toISOString(),
    searchText: normalizeSearchText(event.name, event.category, event.tags),
    createdAt: now.toISOString(),
  };
};

const seededEvents = events.map(addComputedFields);

const sampleBuyers = ["demo-buyer-1", "demo-buyer-2", "demo-buyer-3", "demo-buyer-4"];
const historyTemplate = [
  { eventId: "demo-neo-jazz-istanbul", soldPrice: 790, daysAgo: 4, count: 5 },
  { eventId: "demo-synthwave-sunset", soldPrice: 880, daysAgo: 3, count: 4 },
  { eventId: "demo-late-show-standup", soldPrice: 340, daysAgo: 2, count: 6 },
  { eventId: "demo-romeo-juliet-stage", soldPrice: 610, daysAgo: 2, count: 3 },
  { eventId: "demo-digital-futures-fest", soldPrice: 1250, daysAgo: 1, count: 4 },
  { eventId: "demo-night-run-bosphorus", soldPrice: 520, daysAgo: 1, count: 2 },
];

const historyItems = [];
for (const block of historyTemplate) {
  const event = seededEvents.find((item) => item.id === block.eventId);
  if (!event) continue;

  for (let index = 0; index < block.count; index += 1) {
    const purchasedAt = new Date(now);
    purchasedAt.setUTCDate(purchasedAt.getUTCDate() - block.daysAgo);
    purchasedAt.setUTCHours(9 + index, index * 5, 0, 0);

    historyItems.push({
      eventId: event.id,
      purchasedAt: purchasedAt.toISOString(),
      userId: sampleBuyers[index % sampleBuyers.length],
      soldPrice: block.soldPrice,
      basePrice: event.basePrice,
      category: event.category,
      tags: event.tags,
      totalCapacity: event.totalTickets,
      remainingTickets: Math.max(0, event.availableTickets - index),
    });
  }
}

if (userId) {
  const personalPicks = ["demo-neo-jazz-istanbul", "demo-synthwave-sunset"];
  personalPicks.forEach((eventId, index) => {
    const event = seededEvents.find((item) => item.id === eventId);
    if (!event) return;

    const purchasedAt = new Date(now);
    purchasedAt.setUTCDate(purchasedAt.getUTCDate() - (6 - index));
    purchasedAt.setUTCHours(20, 15 + index, 0, 0);

    historyItems.push({
      eventId: event.id,
      purchasedAt: purchasedAt.toISOString(),
      userId,
      soldPrice: event.price,
      basePrice: event.basePrice,
      category: event.category,
      tags: event.tags,
      totalCapacity: event.totalTickets,
      remainingTickets: event.availableTickets,
    });
  });
}

for (const event of seededEvents) {
  await client.send(new PutCommand({
    TableName: eventsTable,
    Item: event,
  }));
}

if (seedHistory) {
  for (const item of historyItems) {
    await client.send(new PutCommand({
      TableName: historyTable,
      Item: item,
    }));
  }
}

console.log(JSON.stringify({
  success: true,
  region,
  eventsTable,
  historyTable: seedHistory ? historyTable : null,
  seededEvents: seededEvents.length,
  seededHistoryRows: seedHistory ? historyItems.length : 0,
  personalizedUserHistorySeededFor: userId || null,
  eventIds: seededEvents.map((event) => event.id),
}, null, 2));
