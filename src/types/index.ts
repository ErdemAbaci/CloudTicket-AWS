export interface TicketEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  basePrice?: number;
  totalTickets: number;
  availableTickets: number;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  createdAt: string;
}

export interface TicketPurchasedDetail {
  eventId: string;
  userId: string;
  purchasedAt: string;
}
