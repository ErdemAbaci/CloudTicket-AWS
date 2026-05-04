import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const roadmapItems = [
  {
    icon: 'auto-awesome',
    title: 'Dinamik fiyatlandirma',
    description: 'Kalan bilet ve etkinlige kalan gun oranina gore gece 03:00 motoru.',
    status: 'Hafta 8',
  },
  {
    icon: 'recommend',
    title: 'Sana ozel oneriler',
    description: 'Gecmis satin alma ve etiketlere gore mobil ana sayfada kisisel liste.',
    status: 'Hafta 9',
  },
  {
    icon: 'qr-code-scanner',
    title: 'QR dogrulama',
    description: 'Guvenlik gorevlileri icin kamera destekli bilet kontrol akisi.',
    status: 'Prototip',
  },
  {
    icon: 'security',
    title: 'Bot korumasi',
    description: 'Rate limit ve supheli satin alma denemeleri icin koruma katmani.',
    status: 'Hafta 10',
  },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const loginId = user?.signInDetails?.loginId || user?.username || 'TicketMind kullanicisi';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={30} color="#0F172A" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Hesap</Text>
          <Text style={styles.title} numberOfLines={1}>
            {loginId}
          </Text>
          <Text style={styles.subtitle}>Cognito ile guvenli oturum</Text>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <QuickStat label="Bilet tipi" value="QR" icon="qr-code-2" />
        <QuickStat label="Oturum" value="Aktif" icon="verified-user" />
        <QuickStat label="Fiyat" value="AI" icon="insights" />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Yol Haritasi</Text>
            <Text style={styles.panelSubtitle}>Mobil deneyime eklenmeye hazir moduller</Text>
          </View>
        </View>

        {roadmapItems.map((item) => (
          <View key={item.title} style={styles.roadmapItem}>
            <View style={styles.roadmapIcon}>
              <MaterialIcons name={item.icon as any} size={21} color="#0F172A" />
            </View>
            <View style={styles.roadmapBody}>
              <View style={styles.roadmapTopRow}>
                <Text style={styles.roadmapTitle}>{item.title}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.roadmapDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Guvenlik</Text>
        <View style={styles.securityRow}>
          <MaterialIcons name="lock" size={20} color="#047857" />
          <Text style={styles.securityText}>Tokenli API istekleri etkin</Text>
        </View>
        <View style={styles.securityRow}>
          <MaterialIcons name="inventory" size={20} color="#047857" />
          <Text style={styles.securityText}>Overbooking korumasi backend tarafinda hazir</Text>
        </View>
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
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
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
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
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
  panel: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    marginBottom: 16,
  },
  panelHeader: {
    marginBottom: 12,
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  panelSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  roadmapItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roadmapIcon: {
    width: 38,
    height: 38,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapBody: {
    flex: 1,
  },
  roadmapTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  roadmapTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  roadmapDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  statusPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
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
