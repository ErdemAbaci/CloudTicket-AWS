import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getEvents, purchaseTicket } from '../../api';

interface EventData {
  id: string;
  name: string;
  date: string;
  price: number;
  availableTickets?: number;
  totalTickets?: number;
  category?: string;
  tags?: string[];
  basePrice?: number;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });

const formatFullDate = (date: string) =>
  new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

const getAvailabilityRatio = (event: EventData) => {
  if (!event.totalTickets || event.availableTickets === undefined) {
    return 0.72;
  }

  return Math.max(0, Math.min(1, event.availableTickets / event.totalTickets));
};

const getDemandLabel = (event: EventData) => {
  const ratio = getAvailabilityRatio(event);

  if (ratio === 0) {
    return 'Tukendi';
  }

  if (ratio < 0.2) {
    return 'Yuksek talep';
  }

  if (event.basePrice && event.price > event.basePrice) {
    return 'Dinamik fiyat';
  }

  return 'Sana uygun';
};

export default function HomeScreen() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const recommendedEvents = useMemo(() => events.slice(0, 3), [events]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getEvents();
      setEvents(data);
    } catch {
      setError('Etkinlikler yuklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePurchase = async (event: EventData) => {
    if (event.availableTickets !== undefined && event.availableTickets <= 0) {
      Alert.alert('Tukendi', 'Bu etkinlik icin bilet kalmadi.');
      return;
    }

    setPurchasing(event.id);

    try {
      await purchaseTicket(event.id);
      Alert.alert('Bilet hazir', 'Dijital biletin Biletlerim ekranina eklendi.');
      fetchEvents();
    } catch (purchaseError: any) {
      Alert.alert(
        'Islem tamamlanamadi',
        purchaseError.response?.data?.error || 'Bilet alinirken bir sorun olustu.',
      );
    } finally {
      setPurchasing(null);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <TextLabel style={styles.brand}>TicketMind</TextLabel>
            <TextLabel style={styles.heroTitle}>Etkinliklerini akilli sec.</TextLabel>
          </View>
          <View style={styles.aiBadge}>
            <MaterialIcons name="auto-awesome" size={16} color="#0F766E" />
            <TextLabel style={styles.aiBadgeText}>AI hazir</TextLabel>
          </View>
        </View>

        <View style={styles.heroStats}>
          <Metric label="Aktif etkinlik" value={events.length.toString()} />
          <View style={styles.metricDivider} />
          <Metric label="QR bilet" value="Aninda" />
          <View style={styles.metricDivider} />
          <Metric label="Fiyat" value="Canli" />
        </View>
      </View>

      {recommendedEvents.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <TextLabel style={styles.sectionTitle}>Sana Ozel</TextLabel>
              <TextLabel style={styles.sectionSubtitle}>Hafta 9 onerileri icin hazir alan</TextLabel>
            </View>
            <MaterialIcons name="tune" size={22} color="#475569" />
          </View>

          <FlatList
            horizontal
            data={recommendedEvents}
            keyExtractor={(item) => `recommended-${item.id}`}
            renderItem={({ item }) => <RecommendationCard event={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendationList}
          />
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <View>
          <TextLabel style={styles.sectionTitle}>Yaklasan Etkinlikler</TextLabel>
          <TextLabel style={styles.sectionSubtitle}>Stok ve fiyat durumuyla birlikte</TextLabel>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: EventData }) => {
    const isSoldOut = item.availableTickets !== undefined && item.availableTickets <= 0;
    const ratio = getAvailabilityRatio(item);

    return (
      <Pressable style={styles.eventCard}>
        <View style={styles.poster}>
          <TextLabel style={styles.posterMonth}>{formatDate(item.date).split(' ')[1]}</TextLabel>
          <TextLabel style={styles.posterDay}>{formatDate(item.date).split(' ')[0]}</TextLabel>
        </View>

        <View style={styles.eventBody}>
          <View style={styles.eventTitleRow}>
            <TextLabel style={styles.eventTitle} numberOfLines={2}>
              {item.name}
            </TextLabel>
            <View style={[styles.statusPill, isSoldOut ? styles.soldOutPill : undefined]}>
              <TextLabel style={[styles.statusText, isSoldOut ? styles.soldOutText : undefined]}>
                {getDemandLabel(item)}
              </TextLabel>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MaterialIcons name="event" size={16} color="#64748B" />
            <TextLabel style={styles.metaText}>{formatFullDate(item.date)}</TextLabel>
          </View>

          <View style={styles.metaRow}>
            <MaterialIcons name="confirmation-number" size={16} color="#64748B" />
            <TextLabel style={styles.metaText}>
              {item.totalTickets
                ? `${item.availableTickets ?? 0} / ${item.totalTickets} bilet kaldi`
                : 'Stok bilgisi hazirlaniyor'}
            </TextLabel>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
          </View>

          <View style={styles.cardFooter}>
            <View>
              <TextLabel style={styles.priceLabel}>Baslayan fiyat</TextLabel>
              <TextLabel style={styles.price}>{item.price} TL</TextLabel>
            </View>

            <Pressable
              style={[styles.buyButton, isSoldOut ? styles.disabledButton : undefined]}
              disabled={isSoldOut || purchasing === item.id}
              onPress={() => handlePurchase(item)}>
              {purchasing === item.id ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <TextLabel style={styles.buyButtonText}>{isSoldOut ? 'Kapandi' : 'Bileti Al'}</TextLabel>
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <TextLabel style={styles.centeredText}>Etkinlikler hazirlaniyor</TextLabel>
      </View>
    );
  }

  if (error && events.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="cloud-off" size={28} color="#1D4ED8" />
        </View>
        <TextLabel style={styles.emptyTitle}>{error}</TextLabel>
        <Pressable style={styles.retryButton} onPress={fetchEvents}>
          <TextLabel style={styles.retryButtonText}>Tekrar dene</TextLabel>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="event-busy" size={28} color="#1D4ED8" />
            </View>
            <TextLabel style={styles.emptyTitle}>Henuz etkinlik yok</TextLabel>
            <TextLabel style={styles.emptySubtitle}>Yeni etkinlikler yayinlandiginda burada gorunecek.</TextLabel>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchEvents}
      />
    </View>
  );
}

function TextLabel(props: React.ComponentProps<typeof Text>) {
  return <Text {...props} />;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <TextLabel style={styles.metricValue}>{value}</TextLabel>
      <TextLabel style={styles.metricLabel}>{label}</TextLabel>
    </View>
  );
}

function RecommendationCard({ event }: { event: EventData }) {
  return (
    <View style={styles.recommendationCard}>
      <TextLabel style={styles.recommendationTag}>{event.category || 'Populer'}</TextLabel>
      <TextLabel style={styles.recommendationTitle} numberOfLines={2}>
        {event.name}
      </TextLabel>
      <TextLabel style={styles.recommendationDate}>{formatFullDate(event.date)}</TextLabel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    maxWidth: 220,
  },
  aiBadge: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#CCFBF1',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  aiBadgeText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '800',
  },
  heroStats: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 14,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 3,
  },
  recommendationList: {
    gap: 12,
  },
  recommendationCard: {
    width: 184,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  recommendationTag: {
    alignSelf: 'flex-start',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 12,
  },
  recommendationTitle: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  recommendationDate: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 10,
  },
  eventCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  poster: {
    width: 74,
    minHeight: 128,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  posterMonth: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  posterDay: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
  },
  eventBody: {
    flex: 1,
  },
  eventTitleRow: {
    gap: 8,
  },
  eventTitle: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soldOutPill: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },
  soldOutText: {
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  metaText: {
    color: '#475569',
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  priceLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  buyButton: {
    minWidth: 96,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centeredText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
  retryButton: {
    marginTop: 18,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
