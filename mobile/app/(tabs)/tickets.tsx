import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

const formatDate = (date?: string) => {
  if (!date) {
    return 'Tarih bekleniyor';
  }

  return new Date(date).toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
};

const getStatusMeta = (status: string) => {
  const normalized = status?.toLowerCase();

  if (normalized === 'used') {
    return { label: 'Kullanildi', color: '#475569', bg: '#F1F5F9' };
  }

  if (normalized === 'cancelled') {
    return { label: 'Iptal', color: '#B91C1C', bg: '#FEE2E2' };
  }

  return { label: 'Aktif', color: '#047857', bg: '#DCFCE7' };
};

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await getMyTickets();
      setTickets(data);
    } catch {
      setError('Biletler yuklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const renderItem = ({ item }: { item: MyTicket }) => {
    const status = getStatusMeta(item.status);

    return (
      <View style={styles.passCard}>
        <View style={styles.passHeader}>
          <View style={styles.passIcon}>
            <MaterialIcons name="confirmation-number" size={22} color="#1D4ED8" />
          </View>
          <View style={styles.passHeaderText}>
            <Text style={styles.eventName} numberOfLines={2}>
              {item.eventName || 'Etkinlik'}
            </Text>
            <Text style={styles.eventDate}>{formatDate(item.eventDate)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.separator}>
          <View style={styles.cutoutLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.cutoutRight} />
        </View>

        <View style={styles.qrSection}>
          <View style={styles.qrFrame}>
            {item.qrUrl ? (
              <Image source={{ uri: item.qrUrl }} style={styles.qrCode} resizeMode="contain" />
            ) : (
              <MaterialIcons name="qr-code-2" size={104} color="#CBD5E1" />
            )}
          </View>
          <Text style={styles.qrCaption}>Giris kontrolunde bu kod okutulur</Text>
        </View>

        <View style={styles.ticketMetaGrid}>
          <Meta label="Bilet ID" value={item.ticketId} />
          <Meta label="Etkinlik ID" value={item.eventId} />
          <Meta label="Satin alma" value={formatDate(item.purchasedAt)} />
        </View>
      </View>
    );
  };

  if (loading && tickets.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.centeredText}>Biletlerin hazirlaniyor</Text>
      </View>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="sync-problem" size={28} color="#1D4ED8" />
        </View>
        <Text style={styles.emptyTitle}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchTickets}>
          <Text style={styles.retryButtonText}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.ticketId}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Dijital cuzdan</Text>
            <Text style={styles.title}>Biletlerim</Text>
            <Text style={styles.subtitle}>QR kodlar, durum bilgisi ve satin alma kayitlari.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="confirmation-number" size={28} color="#1D4ED8" />
            </View>
            <Text style={styles.emptyTitle}>Aktif biletin yok</Text>
            <Text style={styles.emptySubtitle}>
              Bilet aldiginda QR kodun ve giris bilgilerin burada gorunecek.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchTickets}
      />
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value || '-'}
      </Text>
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
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  title: {
    color: '#0F172A',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  passCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  passIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passHeaderText: {
    flex: 1,
  },
  eventName: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  eventDate: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  separator: {
    height: 24,
    justifyContent: 'center',
  },
  dashedLine: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  cutoutLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    zIndex: 2,
  },
  cutoutRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    zIndex: 2,
  },
  qrSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  qrFrame: {
    width: 218,
    height: 218,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: 194,
    height: 194,
  },
  qrCaption: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },
  ticketMetaGrid: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  metaItem: {
    gap: 3,
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
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
    paddingVertical: 58,
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
