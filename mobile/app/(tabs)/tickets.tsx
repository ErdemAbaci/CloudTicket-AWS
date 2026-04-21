import { StyleSheet, FlatList, ActivityIndicator, Image, View } from 'react-native';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMyTickets } from '../../api';

interface MyTicket {
  ticketId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  purchasedAt: string;
  qrUrl: string;
  status: string;
}

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await getMyTickets();
      setTickets(data);
    } catch (error) {
      console.log('Fetching tickets error: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const renderItem = ({ item }: { item: MyTicket }) => {
    return (
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.eventName}>{item.eventName || "Etkinlik Adı"}</ThemedText>
          <ThemedText style={styles.eventDate}>
            {item.eventDate ? new Date(item.eventDate).toLocaleDateString('tr-TR') : ""}
          </ThemedText>
        </View>

        <View style={styles.qrContainer}>
          <Image 
            source={{ uri: item.qrUrl }} 
            style={styles.qrCode} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.ticketFooter}>
          <ThemedText style={styles.ticketIdLabel}>BİLET ID</ThemedText>
          <ThemedText style={styles.ticketId}>{item.ticketId}</ThemedText>
        </View>
        
        {/* Kesik bilet efekti için */}
        <View style={[styles.cutout, styles.cutoutLeft]} />
        <View style={[styles.cutout, styles.cutoutRight]} />
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Biletlerim</ThemedText>
        <ThemedText style={styles.subtitle}>Giriş yaparken bu QR kodları kullanabilirsiniz.</ThemedText>
      </ThemedView>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
      ) : tickets.length === 0 ? (
        <ThemedText style={{ textAlign: 'center', marginTop: 50 }}>Henüz satın alınmış bir biletiniz yok.</ThemedText>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.ticketId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchTickets}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  cardHeader: {
    backgroundColor: '#4F46E5',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3730A3',
    borderStyle: 'dashed'
  },
  eventName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  eventDate: {
    color: '#E0E7FF',
    fontSize: 14,
    marginTop: 4,
  },
  qrContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  ticketFooter: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  ticketIdLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  ticketId: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
    fontFamily: 'SpaceMono', // or any monospace font if available
  },
  cutout: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    top: 90, // Positioned near the dashed line
  },
  cutoutLeft: {
    left: -15,
  },
  cutoutRight: {
    right: -15,
  }
});
