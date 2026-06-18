import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const region = args.get("--region") || process.env.AWS_REGION || "eu-central-1";
const tableName = args.get("--table") || process.env.EVENTS_TABLE || "cloud-ticket-backend-events-table-dev";

const normalizeSearchText = (...values) =>
  values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const buildEvent = ({
  id,
  name,
  date,
  price,
  basePrice,
  totalTickets,
  availableTickets,
  category,
  tags,
  imageUrl,
}) => {
  const discountPercent = basePrice > price ? Math.round(((basePrice - price) / basePrice) * 100) : 0;

  return {
    id,
    name,
    date,
    price,
    basePrice,
    minPrice: Math.round(basePrice * 0.75),
    maxPrice: Math.round(basePrice * 1.4),
    lastPriceUpdateAt: new Date().toISOString(),
    pricingReason: discountPercent > 0
      ? "Temmuz kampanyasi ve satis hizi icin avantajli fiyat"
      : "Standart fiyat korunuyor",
    pricingTrend: price < basePrice ? "discount" : price > basePrice ? "surge" : "stable",
    discountPercent,
    totalTickets,
    availableTickets,
    category,
    tags,
    searchText: normalizeSearchText(name, category, tags),
    imageUrl,
    createdAt: new Date().toISOString(),
  };
};

const events = [
  buildEvent({
    id: "july-2026-sunset-pop",
    name: "Sunset Pop Live",
    date: "2026-07-05T18:30:00.000Z",
    price: 720,
    basePrice: 900,
    totalTickets: 420,
    availableTickets: 168,
    category: "Konser",
    tags: ["pop", "sunset", "acikhava"],
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
  }),
  buildEvent({
    id: "july-2026-electro-night",
    name: "Electro Night Istanbul",
    date: "2026-07-12T20:00:00.000Z",
    price: 980,
    basePrice: 980,
    totalTickets: 650,
    availableTickets: 210,
    category: "Festival",
    tags: ["elektronik", "dj", "gece"],
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
  }),
  buildEvent({
    id: "july-2026-comedy-club",
    name: "Comedy Club Temmuz",
    date: "2026-07-18T19:00:00.000Z",
    price: 360,
    basePrice: 420,
    totalTickets: 180,
    availableTickets: 54,
    category: "Stand-up",
    tags: ["komedi", "kulup", "haftasonu"],
    imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80",
  }),
  buildEvent({
    id: "july-2026-open-air-theatre",
    name: "Açıkhava Tiyatro Gecesi",
    date: "2026-07-24T18:00:00.000Z",
    price: 590,
    basePrice: 590,
    totalTickets: 260,
    availableTickets: 142,
    category: "Tiyatro",
    tags: ["tiyatro", "acikhava", "drama"],
    imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80",
  }),
  buildEvent({
    id: "july-2026-city-run",
    name: "City Run 10K",
    date: "2026-07-30T06:30:00.000Z",
    price: 480,
    basePrice: 520,
    totalTickets: 800,
    availableTickets: 360,
    category: "Spor",
    tags: ["kosu", "sabah", "sehir"],
    imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
  }),
];

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

for (const event of events) {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: event,
  }));
}

console.log(JSON.stringify({
  success: true,
  region,
  tableName,
  insertedEvents: events.length,
  eventIds: events.map((event) => event.id),
}, null, 2));
