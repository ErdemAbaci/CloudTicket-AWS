import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getEvents, purchaseTicket } from '../../api';

interface TicketData {
  id: string;
  name: string;
  date: string;
  price: number;
  availableTickets?: number;
  totalTickets?: number;
}

export default function HomeScreen() {
  const [events, setEvents] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await getEvents();
      setEvents(data);
    } catch (error) {
      console.log('Fetching error: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePurchase = async (id: string, available?: number) => {
    if (available !== undefined && available <= 0) {
      Alert.alert('Tükendi', 'Maalesef bu etkinlik için bilet kalmadı.');
      return;
    }

    setPurchasing(id);
    try {
      await purchaseTicket(id);
      Alert.alert('Başarılı', 'Biletiniz rezerve edildi!');
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.error || 'Bilet alınırken bir sorun oluştu.');
    } finally {
      setPurchasing(null);
    }
  };

  const renderItem = ({ item }: { item: TicketData }) => {
    const isSoldOut = item.availableTickets !== undefined && item.availableTickets <= 0;

    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
        <ThemedText style={styles.cardDate}>
          {new Date(item.date).toLocaleDateString('tr-TR')}
        </ThemedText>
        <ThemedView style={styles.cardFooter}>
          <ThemedText style={styles.price}>{item.price} ₺</ThemedText>
          <ThemedText style={styles.capacity}>
            {item.totalTickets ? `${item.availableTickets} / ${item.totalTickets} Kaldı` : ''}
          </ThemedText>
        </ThemedView>

        <TouchableOpacity
          style={[styles.buyButton, isSoldOut ? styles.soldOutButton : undefined]}
          disabled={isSoldOut || purchasing === item.id}
          onPress={() => handlePurchase(item.id, item.availableTickets)}>
          <ThemedText style={styles.buyButtonText}>
            {purchasing === item.id ? 'İşleniyor...' : isSoldOut ? 'Tükendi' : 'Bilet Satın Al'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">TicketMind Mobil</ThemedText>
        <ThemedText style={styles.subtitle}>Yaklaşan Etkinlikler</ThemedText>
      </ThemedView>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
      ) : events.length === 0 ? (
        <ThemedText style={{ textAlign: 'center', marginTop: 50 }}>Henüz etkinlik bulunmuyor.</ThemedText>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchEvents}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6', // light gray
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280', // slate-500
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, // For Android
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  cardDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669', // emerald-600
  },
  capacity: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5', // indigo-600
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buyButton: {
    backgroundColor: '#4F46E5', // indigo-600
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  soldOutButton: {
    backgroundColor: '#D1D5DB', // gray-300
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
