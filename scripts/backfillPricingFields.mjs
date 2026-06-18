import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const region = args.get("--region") || process.env.AWS_REGION || "eu-central-1";
const tableName = args.get("--table") || process.env.EVENTS_TABLE;
const isDryRun = process.argv.includes("--dry-run");

if (!tableName) {
  console.error("Usage: node scripts/backfillPricingFields.mjs --table <events-table> [--region eu-central-1] [--dry-run]");
  process.exit(1);
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const roundPrice = (value) => Math.max(1, Math.round(value));

const getDiscountPercent = (price, basePrice) => {
  if (!basePrice || basePrice <= price) {
    return 0;
  }

  return Math.round(((basePrice - price) / basePrice) * 100);
};

const getPricingTrend = (price, basePrice) => {
  if (price < basePrice) return "discount";
  if (price > basePrice) return "surge";
  return "stable";
};

const buildPricingFields = (event, updatedAt) => {
  if (typeof event.price !== "number") {
    return null;
  }

  const basePrice = typeof event.basePrice === "number" ? event.basePrice : event.price;
  const price = event.price;

  return {
    basePrice,
    minPrice: typeof event.minPrice === "number" ? event.minPrice : roundPrice(basePrice * 0.75),
    maxPrice: typeof event.maxPrice === "number" ? event.maxPrice : roundPrice(basePrice * 1.4),
    lastPriceUpdateAt: event.lastPriceUpdateAt || updatedAt,
    pricingReason: event.pricingReason || "Mevcut etkinlik fiyat alanlari geriye donuk tamamlandi",
    pricingTrend: event.pricingTrend || getPricingTrend(price, basePrice),
    discountPercent: typeof event.discountPercent === "number" ? event.discountPercent : getDiscountPercent(price, basePrice),
  };
};

const scanAllEvents = async () => {
  const events = [];
  let ExclusiveStartKey;

  do {
    const result = await client.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey,
    }));

    events.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return events;
};

const updateEvent = async (event, fields) => {
  await client.send(new UpdateCommand({
    TableName: tableName,
    Key: { id: event.id },
    UpdateExpression: [
      "SET basePrice = if_not_exists(basePrice, :basePrice)",
      "minPrice = if_not_exists(minPrice, :minPrice)",
      "maxPrice = if_not_exists(maxPrice, :maxPrice)",
      "lastPriceUpdateAt = if_not_exists(lastPriceUpdateAt, :lastPriceUpdateAt)",
      "pricingReason = if_not_exists(pricingReason, :pricingReason)",
      "pricingTrend = if_not_exists(pricingTrend, :pricingTrend)",
      "discountPercent = if_not_exists(discountPercent, :discountPercent)",
    ].join(", "),
    ExpressionAttributeValues: {
      ":basePrice": fields.basePrice,
      ":minPrice": fields.minPrice,
      ":maxPrice": fields.maxPrice,
      ":lastPriceUpdateAt": fields.lastPriceUpdateAt,
      ":pricingReason": fields.pricingReason,
      ":pricingTrend": fields.pricingTrend,
      ":discountPercent": fields.discountPercent,
    },
  }));
};

const updatedAt = new Date().toISOString();
const events = await scanAllEvents();
let updatedCount = 0;
let skippedCount = 0;

for (const event of events) {
  const fields = buildPricingFields(event, updatedAt);

  if (!event.id || !fields) {
    skippedCount += 1;
    continue;
  }

  const missingFields = [
    "basePrice",
    "minPrice",
    "maxPrice",
    "lastPriceUpdateAt",
    "pricingReason",
    "pricingTrend",
    "discountPercent",
  ].filter((field) => event[field] === undefined);

  if (!missingFields.length) {
    skippedCount += 1;
    continue;
  }

  if (!isDryRun) {
    await updateEvent(event, fields);
  }

  updatedCount += 1;
  console.log(`${isDryRun ? "Would update" : "Updated"} ${event.id} (${event.name || "isimsiz"}): ${missingFields.join(", ")}`);
}

console.log(JSON.stringify({
  tableName,
  region,
  dryRun: isDryRun,
  scannedEvents: events.length,
  updatedEvents: updatedCount,
  skippedEvents: skippedCount,
  updatedAt,
}, null, 2));
