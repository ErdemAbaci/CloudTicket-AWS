import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

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

const interestChips = ['Konser', 'Festival', 'Tiyatro', 'Stand-up', 'Spor'];

const formatDate = (value?: string) => {
  if (!value) return 'Henuz yok';

  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function ProfileScreen() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [eventRemindersEnabled, setEventRemindersEnabled] = useState(true);
  const loginId = user?.signInDetails?.loginId || user?.username || 'TicketMind kullanicisi';

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      try {
        const { data } = await getMyTickets();
        if (isMounted) {
          setTickets(data || []);
        }
      } catch {
        if (isMounted) {
          setTickets([]);
        }
      } finally {
        if (isMounted) {
          setLoadingTickets(false);
        }
      }
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status?.toLowerCase() !== 'cancelled'),
    [tickets],
  );
  const nextTicket = useMemo(() => {
    return [...activeTickets].sort(
      (a, b) => new Date(a.eventDate || 0).getTime() - new Date(b.eventDate || 0).getTime(),
    )[0];
  }, [activeTickets]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={30} color="#0F172A" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Hesap</Text>
          <Text style={styles.title} numberOfLines={1}>
            {loginId}
          </Text>
          <Text style={styles.subtitle}>Guvenli oturum ve kisisel bilet deneyimi</Text>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <QuickStat label="Aktif bilet" value={loadingTickets ? '-' : String(activeTickets.length)} icon="confirmation-number" />
        <QuickStat label="QR cuzdan" value="Hazir" icon="qr-code-2" />
        <QuickStat label="AI oneriler" value="Acik" icon="auto-awesome" />
      </View>

      <View style={styles.featurePanel}>
        <View style={styles.featureIcon}>
          <MaterialIcons name="event-available" size={24} color="#047857" />
        </View>
        <View style={styles.featureBody}>
          <Text style={styles.featureLabel}>Siradaki etkinlik</Text>
          {loadingTickets ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#0F172A" />
              <Text style={styles.mutedText}>Biletlerin kontrol ediliyor</Text>
            </View>
          ) : nextTicket ? (
            <>
              <Text style={styles.nextEventTitle} numberOfLines={2}>
                {nextTicket.eventName || 'Etkinlik'}
              </Text>
              <Text style={styles.featureSubtitle}>{formatDate(nextTicket.eventDate)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.nextEventTitle}>Henüz aktif bilet yok</Text>
              <Text style={styles.featureSubtitle}>Begendigin etkinlikleri kesfet ve QR biletini burada takip et.</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Tercihler</Text>
            <Text style={styles.panelSubtitle}>Sana daha uygun etkinlikleri one cikarmak icin</Text>
          </View>
          <MaterialIcons name="tune" size={22} color="#94A3B8" />
        </View>

        <View style={styles.chipWrap}>
          {interestChips.map((chip, index) => (
            <View key={chip} style={[styles.interestChip, index < 2 ? styles.activeInterestChip : undefined]}>
              <Text style={[styles.interestText, index < 2 ? styles.activeInterestText : undefined]}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Bildirimler</Text>
            <Text style={styles.panelSubtitle}>Fiyat ve etkinlik hatirlatmalari</Text>
          </View>
          <MaterialIcons name="notifications-none" size={22} color="#94A3B8" />
        </View>

        <PreferenceRow
          icon="local-offer"
          title="Fiyat dustugunde haber ver"
          description="Dinamik fiyat avantajlarini kacirma"
          value={priceAlertsEnabled}
          onValueChange={setPriceAlertsEnabled}
        />
        <PreferenceRow
          icon="event-note"
          title="Etkinlik hatirlaticilari"
          description="Yaklasan biletlerin icin sakin bir hatirlatma"
          value={eventRemindersEnabled}
          onValueChange={setEventRemindersEnabled}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Guvenlik</Text>
        <SecurityRow icon="verified-user" text="Cognito ile kimlik dogrulama aktif" />
        <SecurityRow icon="https" text="Tokenli API istekleri etkin" />
        <SecurityRow icon="inventory" text="Stok ve overbooking korumasi backend tarafinda hazir" />
      </View>

      <Pressable style={styles.signOutButton} onPress={signOut}>
        <MaterialIcons name="logout" size={20} color="#B91C1C" />
        <Text style={styles.signOutText}>Cikis yap</Text>
      </Pressable>
    </ScrollView>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.quickStat}>
      <MaterialIcons name={icon as any} size={22} color="#0F172A" />
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceIcon}>
        <MaterialIcons name={icon as any} size={20} color="#0F172A" />
      </View>
      <View style={styles.preferenceBody}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#BBF7D0' }}
        thumbColor={value ? '#047857' : '#F8FAFC'}
      />
    </View>
  );
}

function SecurityRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.securityRow}>
      <MaterialIcons name={icon as any} size={20} color="#047857" />
      <Text style={styles.securityText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 32,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    padding: 12,
  },
  quickValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },
  quickLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },
  featurePanel: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    flex: 1,
  },
  featureLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '900',
  },
  featureSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    padding: 16,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  panelSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  nextEventTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  mutedText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  activeInterestChip: {
    backgroundColor: '#0F172A',
  },
  interestText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
  },
  activeInterestText: {
    color: '#FFFFFF',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  preferenceIcon: {
    width: 38,
    height: 38,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceBody: {
    flex: 1,
  },
  preferenceTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  preferenceDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  securityText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  signOutButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  signOutText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '900',
  },
});
