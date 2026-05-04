import { TicketEvent } from "../types";

export interface PricingDecision {
  price: number;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  pricingReason: string;
  pricingTrend: "discount" | "surge" | "stable";
  discountPercent: number;
}

const roundPrice = (value: number) => Math.max(1, Math.round(value));

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const getDaysUntilEvent = (eventDate: string, now: Date) => {
  const eventTime = new Date(eventDate).getTime();
  const nowTime = now.getTime();
  return Math.ceil((eventTime - nowTime) / (1000 * 60 * 60 * 24));
};

const getSoldRatio = (event: TicketEvent) => {
  if (!event.totalTickets || event.totalTickets <= 0) {
    return 0;
  }

  const soldTickets = Math.max(0, event.totalTickets - event.availableTickets);
  return clamp(soldTickets / event.totalTickets, 0, 1);
};

const getDemandMultiplier = (soldRatio: number, daysUntilEvent: number) => {
  if (soldRatio >= 0.85) {
    return { multiplier: 1.2, reason: "Talep cok yuksek, kalan bilet az" };
  }

  if (soldRatio >= 0.65 && daysUntilEvent <= 21) {
    return { multiplier: 1.14, reason: "Talep guclu ve etkinlik yaklasiyor" };
  }

  if (soldRatio >= 0.45 && daysUntilEvent <= 7) {
    return { multiplier: 1.08, reason: "Son hafta talebi fiyat yukseltti" };
  }

  if (soldRatio <= 0.2 && daysUntilEvent <= 10) {
    return { multiplier: 0.9, reason: "Etkinlik yaklasiyor, satis hizi dusuk" };
  }

  if (soldRatio <= 0.35 && daysUntilEvent <= 21) {
    return { multiplier: 0.95, reason: "Satisi hizlandirmak icin fiyat dustu" };
  }

  return { multiplier: 1, reason: "Talep dengeli, fiyat sabit tutuldu" };
};

const limitDailyMovement = (currentPrice: number, targetPrice: number) => {
  const maxDecrease = currentPrice * 0.85;
  const maxIncrease = currentPrice * 1.15;
  return clamp(targetPrice, maxDecrease, maxIncrease);
};

export const calculateDynamicPrice = (event: TicketEvent, now = new Date()): PricingDecision => {
  const basePrice = roundPrice(event.basePrice || event.price);
  const currentPrice = roundPrice(event.price || basePrice);
  const minPrice = roundPrice(event.minPrice || basePrice * 0.75);
  const maxPrice = roundPrice(event.maxPrice || basePrice * 1.4);
  const daysUntilEvent = getDaysUntilEvent(event.date, now);
  const soldRatio = getSoldRatio(event);
  const { multiplier, reason } = getDemandMultiplier(soldRatio, daysUntilEvent);
  const targetPrice = roundPrice(basePrice * multiplier);
  const boundedPrice = roundPrice(clamp(limitDailyMovement(currentPrice, targetPrice), minPrice, maxPrice));
  const discountPercent = basePrice > boundedPrice
    ? Math.round(((basePrice - boundedPrice) / basePrice) * 100)
    : 0;

  let pricingTrend: PricingDecision["pricingTrend"] = "stable";
  if (boundedPrice < basePrice) {
    pricingTrend = "discount";
  } else if (boundedPrice > basePrice) {
    pricingTrend = "surge";
  }

  return {
    price: boundedPrice,
    basePrice,
    minPrice,
    maxPrice,
    pricingReason: reason,
    pricingTrend,
    discountPercent,
  };
};
