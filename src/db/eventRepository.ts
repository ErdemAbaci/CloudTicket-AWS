import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./client";
import { EventSearchParams, TicketEvent } from "../types";

const TABLE_NAME = process.env.EVENTS_TABLE || "";
const DEFAULT_SEARCH_LIMIT = 60;
const MAX_SEARCH_LIMIT = 100;

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getEventSearchText = (event: Partial<TicketEvent>) => {
  if (event.searchText) {
    return normalizeText(event.searchText);
  }

  return normalizeText([
    event.name,
    event.category,
    ...(event.tags || []),
  ].filter(Boolean).join(" "));
};

const parseLimit = (limit?: number) => {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(MAX_SEARCH_LIMIT, Math.max(1, Math.floor(limit)));
};

const eventMatchesSearch = (event: TicketEvent, params: EventSearchParams) => {
  const searchText = getEventSearchText(event);

  if (params.category && params.category !== "Tümü" && event.category !== params.category) {
    return false;
  }

  if (params.tags?.length) {
    const eventTags = new Set((event.tags || []).map(normalizeText));
    const hasEveryTag = params.tags.every((tag) => eventTags.has(normalizeText(tag)));

    if (!hasEveryTag) {
      return false;
    }
  }

  if (params.search) {
    const tokens = normalizeText(params.search)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length && !tokens.every((token) => searchText.includes(token))) {
      return false;
    }
  }

  return true;
};

export const createEventItem = async (eventData: TicketEvent) => {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: eventData,
  }));
};

export const listAllEvents = async () => {
  const items: TicketEvent[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey,
    }));

    items.push(...((result.Items || []) as TicketEvent[]));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const searchEvents = async (params: EventSearchParams) => {
  const limit = parseLimit(params.limit);
  const events = await listAllEvents();

  return events
    .filter((event) => eventMatchesSearch(event, params))
    .slice(0, limit);
};

export const getEventById = async (id: string) => {
  const result = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
  return result.Item as TicketEvent | undefined;
};

export const decrementAvailableTickets = async (id: string) => {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: "SET availableTickets = availableTickets - :dec",
    ConditionExpression: "availableTickets >= :dec", // Stok 1 veya fazlaysa düş
    ExpressionAttributeValues: {
      ":dec": 1
    }
  }));
};
