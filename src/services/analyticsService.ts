import { AnalyticsOverview, TicketPurchaseHistory } from "../types";

const formatDayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

export const buildAnalyticsOverview = (history: TicketPurchaseHistory[]): AnalyticsOverview => {
  const totalRevenue = history.reduce((sum, item) => sum + item.soldPrice, 0);
  const soldTickets = history.length;
  const averageTicketPrice = soldTickets > 0 ? Number((totalRevenue / soldTickets).toFixed(2)) : 0;

  const categoryMap = new Map<string, { soldTickets: number; revenue: number }>();
  const eventMap = new Map<string, { soldTickets: number; revenue: number }>();
  const dailyMap = new Map<string, { soldTickets: number; revenue: number }>();

  history.forEach((item) => {
    const categoryEntry = categoryMap.get(item.category) || { soldTickets: 0, revenue: 0 };
    categoryEntry.soldTickets += 1;
    categoryEntry.revenue += item.soldPrice;
    categoryMap.set(item.category, categoryEntry);

    const eventEntry = eventMap.get(item.eventId) || { soldTickets: 0, revenue: 0 };
    eventEntry.soldTickets += 1;
    eventEntry.revenue += item.soldPrice;
    eventMap.set(item.eventId, eventEntry);

    const dayKey = formatDayKey(item.purchasedAt);
    const dailyEntry = dailyMap.get(dayKey) || { soldTickets: 0, revenue: 0 };
    dailyEntry.soldTickets += 1;
    dailyEntry.revenue += item.soldPrice;
    dailyMap.set(dayKey, dailyEntry);
  });

  const topCategories = [...categoryMap.entries()]
    .map(([category, stats]) => ({
      category,
      soldTickets: stats.soldTickets,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.soldTickets - a.soldTickets || b.revenue - a.revenue)
    .slice(0, 4);

  const topEvents = [...eventMap.entries()]
    .map(([eventId, stats]) => ({
      eventId,
      soldTickets: stats.soldTickets,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.soldTickets - a.soldTickets)
    .slice(0, 5);

  const daily = [...dailyMap.entries()]
    .map(([date, stats]) => ({
      date,
      soldTickets: stats.soldTickets,
      revenue: stats.revenue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  return {
    totalRevenue,
    soldTickets,
    averageTicketPrice,
    uniqueEventsSold: eventMap.size,
    topCategory: topCategories[0],
    topCategories,
    topEvents,
    daily,
  };
};
