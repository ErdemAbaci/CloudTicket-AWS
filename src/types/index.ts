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

export interface TicketPurchaseHistory {
  eventId: string;
  purchasedAt: string;
  userId: string;
  soldPrice: number;
  basePrice: number;
  category: string;
  tags: string[];
  totalCapacity: number;
  remainingTickets: number;
}

export interface RecommendedEvent extends TicketEvent {
  recommendationScore: number;
  recommendationReason: string;
  recommendationSignals?: string[];
  aiConfidence?: number;
  aiProvider?: "rule-based" | "gemini";
}

export interface AiRecommendationCache {
  userId: string;
  generatedAt: string;
  expiresAt: number;
  provider: "rule-based" | "gemini";
  recommendations: RecommendedEvent[];
}

export interface PurchaseRateLimitRecord {
  limiterKey: string;
  attempts: number;
  windowStartedAt: number;
  expiresAt: number;
  updatedAt: string;
}
