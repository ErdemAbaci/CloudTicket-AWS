import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";
import { formatResponse } from "../../utils/response";
import { publishTicketEvent } from "../../services/eventService";
import { TicketEvent } from "../../types";

const normalizeSearchText = (...values: Array<string | string[] | undefined>) => {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return formatResponse(400, { error: "Body eksik" });
    }

    const body = JSON.parse(event.body) as Partial<TicketEvent>;

    if (!body.name || typeof body.price !== "number" || typeof body.totalTickets !== "number") {
      return formatResponse(400, { error: "İsim, Fiyat ve Toplam Bilet (totalTickets) zorunludur" });
    }

    const eventId = randomUUID();
    const basePrice = body.basePrice || body.price;

    const messageBody: TicketEvent = {
      id: eventId,
      name: body.name,
      date: body.date || new Date().toISOString(),
      price: body.price,
      basePrice,
      minPrice: body.minPrice || Math.round(basePrice * 0.75),
      maxPrice: body.maxPrice || Math.round(basePrice * 1.4),
      pricingTrend: body.price < basePrice ? "discount" : body.price > basePrice ? "surge" : "stable",
      discountPercent: body.price < basePrice ? Math.round(((basePrice - body.price) / basePrice) * 100) : 0,
      totalTickets: body.totalTickets,
      availableTickets: body.totalTickets,
      category: body.category || "Genel",
      tags: body.tags || [],
      searchText: normalizeSearchText(body.name, body.category || "Genel", body.tags),
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString()
    };

    await publishTicketEvent(messageBody);

    return formatResponse(202, {
      message: "İsteğiniz kuyruğa alındı.",
      id: eventId
    });
  } catch (error) {
    console.error(error);
    return formatResponse(500, { error: "Sunucu hatası" });
  }
};
