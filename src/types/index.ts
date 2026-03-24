export interface TicketEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  totalTickets: number;
  availableTickets: number;
  imageUrl?: string;
  createdAt: string;
}
