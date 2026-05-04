import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const categories = ['Tümü', 'Konser', 'Festival', 'Tiyatro', 'Stand-up', 'Spor'];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatLongDate = (date: string) =>
  new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

const getRemainingLabel = (event: EventData) => {
  if (!event.totalTickets || event.availableTickets === undefined) {
    return 'Biletler satışta';
  }

  if (event.availableTickets <= 0) {
    return 'Tükendi';
  }

  if (event.availableTickets <= Math.ceil(event.totalTickets * 0.2)) {
    return 'Son biletler';
  }

  return `${event.availableTickets} bilet kaldı`;
};

export default function HomeScreen() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const featuredEvent = events[0];
  const recommendedEvents = useMemo(() => events.slice(0, 3), [events]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getEvents({
        search: searchTerm || undefined,
        category: selectedCategory === 'Tümü' ? undefined : selectedCategory,
        limit: 60,
      });
      setEvents(data);
    } catch {
      setError('Etkinlikler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePurchase = async (event: EventData) => {
    if (event.availableTickets !== undefined && event.availableTickets <= 0) {
      Alert.alert('Tükendi', 'Bu etkinlik için bilet kalmadı.');
      return;
    }

    setPurchasing(event.id);

    try {
      await purchaseTicket(event.id);
      Alert.alert('Bilet hazır', 'Dijital biletin Biletlerim ekranına eklendi.');
      setSelectedEvent(null);
      fetchEvents();
    } catch (purchaseError: any) {
      Alert.alert(
        'İşlem tamamlanamadı',
        purchaseError.response?.data?.error || 'Bilet alınırken bir sorun oluştu.',
      );
    } finally {
      setPurchasing(null);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <MaterialIcons name="confirmation-number" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brand}>TicketMind</Text>
            <Text style={styles.brandSubtitle}>Etkinlik keşfi</Text>
          </View>
        </View>

        <View style={styles.aiPill}>
          <MaterialIcons name="auto-awesome" size={16} color="#047857" />
          <Text style={styles.aiPillText}>AI destekli öneriler yakında</Text>
        </View>

        <Text style={styles.heroTitle}>Şehirdeki iyi anları kaçırma.</Text>
        <Text style={styles.heroText}>
          Konser, festival, sahne ve spor etkinliklerini sakin ve güvenli bir deneyimle keşfet.
        </Text>
      </View>

      <View style={styles.searchShell}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={22} color="#94A3B8" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Etkinlik, kategori veya etiket ara"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedCategory(item)}
            style={[styles.categoryChip, selectedCategory === item ? styles.activeCategoryChip : undefined]}>
            <Text style={[styles.categoryText, selectedCategory === item ? styles.activeCategoryText : undefined]}>
              {item}
            </Text>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />

      {featuredEvent ? (
        <View style={styles.featuredCard}>
          <View style={styles.featuredTopRow}>
            <Text style={styles.featuredTag}>{featuredEvent.category || 'Öne çıkan'}</Text>
            <Text style={styles.featuredStatus}>{getRemainingLabel(featuredEvent)}</Text>
          </View>
          <View style={styles.featuredBody}>
            <Text style={styles.featuredDate}>{formatLongDate(featuredEvent.date)}</Text>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {featuredEvent.name}
            </Text>
            <View style={styles.featuredFooter}>
              <Text style={styles.featuredPrice}>{featuredEvent.price} TL</Text>
              <Pressable style={styles.darkButton} onPress={() => setSelectedEvent(featuredEvent)}>
                <Text style={styles.darkButtonText}>İncele</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {recommendedEvents.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Sana Özel</Text>
              <Text style={styles.sectionTitle}>Bugün öne çıkanlar</Text>
            </View>
            <MaterialIcons name="favorite-border" size={22} color="#94A3B8" />
          </View>

          <FlatList
            horizontal
            data={recommendedEvents}
            keyExtractor={(item) => `recommended-${item.id}`}
            renderItem={({ item }) => <RecommendationCard event={item} onPress={() => setSelectedEvent(item)} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendationList}
          />
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionKicker}>Etkinlikler</Text>
          <Text style={styles.sectionTitle}>Yaklaşan deneyimler</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: EventData }) => {
    const isSoldOut = item.availableTickets !== undefined && item.availableTickets <= 0;

    return (
      <View style={styles.eventCard}>
        <View style={styles.dateTile}>
          <Text style={styles.dateMonth}>
            {new Date(item.date).toLocaleDateString('tr-TR', { month: 'short' })}
          </Text>
          <Text style={styles.dateDay}>{new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric' })}</Text>
        </View>

        <View style={styles.eventBody}>
          <View style={styles.eventTopRow}>
            <Text style={styles.eventCategory}>{item.category || 'Genel'}</Text>
            <MaterialIcons name="favorite-border" size={20} color="#CBD5E1" />
          </View>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="event" size={16} color="#64748B" />
            <Text style={styles.metaText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="place" size={16} color="#64748B" />
            <Text style={styles.metaText}>TicketMind sahnesi</Text>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceLabel}>Başlayan fiyat</Text>
              <Text style={styles.price}>{item.price} TL</Text>
            </View>

            <Pressable
              style={[styles.buyButton, isSoldOut ? styles.outlineButton : undefined]}
              onPress={() => setSelectedEvent(item)}>
              <Text style={[styles.buyButtonText, isSoldOut ? styles.outlineButtonText : undefined]}>İncele</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.centeredText}>Etkinlikler hazırlanıyor</Text>
      </View>
    );
  }

  if (error && events.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="cloud-off" size={28} color="#0F172A" />
        </View>
        <Text style={styles.emptyTitle}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchEvents}>
          <Text style={styles.retryButtonText}>Tekrar dene</Text>
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
              <MaterialIcons name="search-off" size={28} color="#0F172A" />
            </View>
            <Text style={styles.emptyTitle}>Uygun etkinlik bulunamadı</Text>
            <Text style={styles.emptySubtitle}>Aramayı veya kategori filtresini değiştirerek tekrar dene.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchEvents}
      />
      <EventDetailSheet
        event={selectedEvent}
        purchasing={purchasing}
        onClose={() => setSelectedEvent(null)}
        onPurchase={handlePurchase}
      />
    </View>
  );
}

function RecommendationCard({ event, onPress }: { event: EventData; onPress: () => void }) {
  return (
    <Pressable style={styles.recommendationCard} onPress={onPress}>
      <View style={styles.recommendationIcon}>
        <MaterialIcons name="auto-awesome" size={20} color="#047857" />
      </View>
      <Text style={styles.recommendationTitle} numberOfLines={2}>
        {event.name}
      </Text>
      <Text style={styles.recommendationDate}>{formatDate(event.date)}</Text>
      <View style={styles.recommendationFooter}>
        <Text style={styles.recommendationTag}>{event.category || 'Genel'}</Text>
        <Text style={styles.recommendationPrice}>{event.price} TL</Text>
      </View>
    </Pressable>
  );
}

function EventDetailSheet({
  event,
  purchasing,
  onClose,
  onPurchase,
}: {
  event: EventData | null;
  purchasing: string | null;
  onClose: () => void;
  onPurchase: (event: EventData) => void;
}) {
  if (!event) {
    return null;
  }

  const isSoldOut = event.availableTickets !== undefined && event.availableTickets <= 0;
  const isPurchasing = purchasing === event.id;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.detailSheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScrollContent}>
            <View style={styles.detailHero}>
              <View style={styles.detailHeroOverlay} />
              <Pressable style={styles.detailCloseButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat">
                <MaterialIcons name="close" size={22} color="#475569" />
              </Pressable>

              <View style={styles.detailHeroContent}>
                <View style={styles.detailBadgeRow}>
                  <Text style={styles.detailCategory}>{event.category || 'Etkinlik'}</Text>
                  <Text style={styles.detailStatus}>{getRemainingLabel(event)}</Text>
                </View>
                <Text style={styles.detailTitle}>{event.name}</Text>
              </View>
            </View>

            <View style={styles.detailInfoGrid}>
              <DetailInfo icon="event" label="Tarih" value={formatLongDate(event.date)} />
              <DetailInfo icon="place" label="Mekan" value="TicketMind sahnesi" />
              <DetailInfo icon="local-offer" label="Başlayan fiyat" value={`${event.price} TL`} />
              <DetailInfo icon="confirmation-number" label="Durum" value={getRemainingLabel(event)} />
            </View>

            {event.tags && event.tags.length > 0 ? (
              <View style={styles.detailTags}>
                {event.tags.map((tag) => (
                  <Text key={tag} style={styles.detailTag}>
                    #{tag}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.detailIdBox}>
              <Text style={styles.detailIdLabel}>Etkinlik ID</Text>
              <Text style={styles.detailIdText}>{event.id}</Text>
            </View>
          </ScrollView>

          <View style={styles.detailFooter}>
            <Pressable style={styles.secondaryAction} onPress={onClose}>
              <Text style={styles.secondaryActionText}>Kapat</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryAction, isSoldOut ? styles.disabledButton : undefined]}
              disabled={isSoldOut || isPurchasing}
              onPress={() => onPurchase(event)}>
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryActionText}>{isSoldOut ? 'Tükendi' : 'Satın Al'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailInfo({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailInfoCard}>
      <View style={styles.detailInfoIcon}>
        <MaterialIcons name={icon} size={20} color="#475569" />
      </View>
      <Text style={styles.detailInfoLabel}>{label}</Text>
      <Text style={styles.detailInfoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 30,
  },
  hero: {
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  brand: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  aiPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 24,
  },
  aiPillText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  heroTitle: {
    color: '#0F172A',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    marginTop: 18,
  },
  heroText: {
    color: '#64748B',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  searchShell: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 28,
    padding: 8,
    marginTop: 18,
  },
  searchBox: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryList: {
    gap: 8,
    paddingVertical: 16,
  },
  categoryChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  activeCategoryChip: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  featuredCard: {
    minHeight: 260,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    padding: 22,
    overflow: 'hidden',
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  featuredTag: {
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  featuredStatus: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  featuredBody: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 36,
  },
  featuredDate: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  featuredPrice: {
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '900',
  },
  darkButton: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  darkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  section: {
    marginTop: 26,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 14,
  },
  sectionKicker: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  recommendationList: {
    gap: 12,
  },
  recommendationCard: {
    width: 188,
    minHeight: 168,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: 16,
  },
  recommendationIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  recommendationTitle: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 18,
  },
  recommendationDate: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  recommendationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  recommendationTag: {
    color: '#475569',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  recommendationPrice: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  eventCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: 14,
    marginBottom: 14,
  },
  dateTile: {
    width: 72,
    minHeight: 142,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  dateDay: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  eventBody: {
    flex: 1,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventCategory: {
    color: '#475569',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  eventTitle: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  metaText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  priceLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  price: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  buyButton: {
    minWidth: 82,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  outlineButton: {
    backgroundColor: '#F1F5F9',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  outlineButtonText: {
    color: '#64748B',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  detailSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: '#F7F4EF',
    overflow: 'hidden',
  },
  detailScrollContent: {
    padding: 12,
    paddingBottom: 18,
  },
  detailHero: {
    minHeight: 226,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  detailHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    opacity: 0.96,
  },
  detailCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  detailHeroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  detailCategory: {
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  detailStatus: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  detailInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  detailInfoCard: {
    width: '48.4%',
    minHeight: 138,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 14,
  },
  detailInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  detailInfoLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailInfoValue: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  detailTag: {
    color: '#475569',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  detailIdBox: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
  },
  detailIdLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailIdText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.8)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },
  secondaryAction: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  secondaryActionText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
  },
  primaryAction: {
    flex: 1.2,
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    backgroundColor: '#F7F4EF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centeredText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
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
    borderRadius: 999,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
