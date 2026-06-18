const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const apiUrl = args.get("--api-url") || process.env.API_URL;
const token = args.get("--token") || process.env.AUTH_TOKEN;
const eventId = args.get("--event-id") || process.env.EVENT_ID;
const totalRequests = Number(args.get("--requests") || process.env.REQUESTS || 10);
const concurrency = Number(args.get("--concurrency") || process.env.CONCURRENCY || 5);

if (!apiUrl || !token || !eventId) {
  console.error("Usage: node scripts/loadTestPurchases.mjs --api-url <url> --token <id-token> --event-id <eventId> [--requests 10] [--concurrency 5]");
  process.exit(1);
}

const endpoint = `${apiUrl.replace(/\/$/, "")}/event/${eventId}/purchase`;
const results = [];
let started = 0;

const runOne = async () => {
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const body = await response.text();

    results.push({
      status: response.status,
      durationMs: Date.now() - startedAt,
      body,
    });
  } catch (error) {
    results.push({
      status: "NETWORK_ERROR",
      durationMs: Date.now() - startedAt,
      body: String(error),
    });
  }
};

const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, async () => {
  while (started < totalRequests) {
    started += 1;
    await runOne();
  }
});

await Promise.all(workers);

const grouped = results.reduce((acc, item) => {
  const key = String(item.status);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({
  endpoint,
  totalRequests,
  concurrency,
  statusCounts: grouped,
  averageDurationMs: Math.round(results.reduce((sum, item) => sum + item.durationMs, 0) / results.length),
  sample: results.slice(0, 5),
}, null, 2));
