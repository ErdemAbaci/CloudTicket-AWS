export interface TicketEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  lastPriceUpdateAt?: string;
  pricingReason?: string;
  pricingTrend?: "discount" | "surge" | "stable";
  discountPercent?: number;
  totalTickets: number;
  availableTickets: number;
  category?: string;
  tags?: string[];
  searchText?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface EventSearchParams {
  search?: string;
  category?: string;
  tags?: string[];
  limit?: number;
}

export interface TicketPurchasedDetail {
  eventId: string;
  userId: string;
  purchasedAt: string;
}
