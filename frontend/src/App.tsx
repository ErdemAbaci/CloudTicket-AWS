import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useQuery } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import {
  Activity,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  LayoutDashboard,
  LogOut,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Ticket,
  UploadCloud,
  User,
  WalletCards,
} from 'lucide-react';
import api from './api';
import 'react-toastify/dist/ReactToastify.css';

import HealthCheck from './components/HealthCheck';
import CreateEventModal from './components/CreateEventModal';
import EventDetailModal from './components/EventDetailModal';
import MyTicketsModal from './components/MyTicketsModal';

interface TicketData {
  id: string;
  name: string;
  date: string;
  price: number;
  basePrice?: number;
  availableTickets?: number;
  totalTickets?: number;
  category?: string;
  tags?: string[];
  imageUrl?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const getSoldCount = (event: TicketData) => {
  if (!event.totalTickets || event.availableTickets === undefined) {
    return 0;
  }

  return Math.max(0, event.totalTickets - event.availableTickets);
};

const getFillRate = (event: TicketData) => {
  if (!event.totalTickets) {
    return 0;
  }

  return Math.min(100, Math.round((getSoldCount(event) / event.totalTickets) * 100));
};

function App() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMyTicketsModalOpen, setIsMyTicketsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery<TicketData[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data;
    },
    enabled: !!user,
  });

  const metrics = useMemo(() => {
    const totalCapacity = events.reduce((sum, event) => sum + (event.totalTickets || 0), 0);
    const soldTickets = events.reduce((sum, event) => sum + getSoldCount(event), 0);
    const estimatedRevenue = events.reduce(
      (sum, event) => sum + getSoldCount(event) * Number(event.price || 0),
      0,
    );
    const lowStockCount = events.filter(
      (event) => event.totalTickets && event.availableTickets !== undefined && getFillRate(event) >= 80,
    ).length;

    return {
      totalEvents: events.length,
      soldTickets,
      totalCapacity,
      estimatedRevenue,
      lowStockCount,
    };
  }, [events]);

  const handleEventClick = (id: string) => {
    setSelectedEventId(id);
    setIsDetailModalOpen(true);
  };

  return (
    <Authenticator>
      <div className="min-h-screen bg-slate-100 font-sans text-slate-950">
        <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />

        <CreateEventModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        <EventDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          eventId={selectedEventId}
        />
        <MyTicketsModal isOpen={isMyTicketsModalOpen} onClose={() => setIsMyTicketsModalOpen(false)} />

        <div className="flex min-h-screen">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-black leading-none text-slate-950">TicketMind</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Organizer Console
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
              <div>
                <p className="px-3 text-xs font-black uppercase tracking-wide text-slate-400">Operasyon</p>
                <div className="mt-3 space-y-1">
                  <button className="flex w-full items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-black text-blue-700">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                  >
                    <Plus className="h-4 w-4" />
                    Etkinlik Oluştur
                  </button>
                  <button
                    onClick={() => setIsMyTicketsModalOpen(true)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                  >
                    <WalletCards className="h-4 w-4" />
                    Dijital Biletler
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-xs font-black uppercase tracking-wide text-slate-400">Faz Takibi</p>
                <div className="mt-3 space-y-2">
                  <RoadmapMini icon={<UploadCloud className="h-4 w-4" />} label="Medya & S3" state="Hazır" />
                  <RoadmapMini icon={<Sparkles className="h-4 w-4" />} label="AI Fiyatlandırma" state="Sırada" />
                  <RoadmapMini icon={<QrCode className="h-4 w-4" />} label="QR Doğrulama" state="Prototip" />
                  <RoadmapMini icon={<ShieldCheck className="h-4 w-4" />} label="Bot Koruması" state="Planlı" />
                </div>
              </div>

              <div>
                <p className="px-3 text-xs font-black uppercase tracking-wide text-slate-400">Sistem</p>
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <HealthCheck />
                </div>
              </div>
            </nav>

            <div className="border-t border-slate-200 p-4">
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </button>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
              <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                    <Activity className="h-4 w-4" />
                    Canlı Operasyon
                  </div>
                  <h1 className="mt-1 truncate text-xl font-black text-slate-950 sm:text-2xl">
                    Organizatör Dashboard
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMyTicketsModalOpen(true)}
                    className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 sm:flex"
                  >
                    <WalletCards className="h-4 w-4" />
                    Biletlerim
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                    Yeni Etkinlik
                  </button>
                  <button
                    onClick={() => toast.info('Yeni bildirim bulunmuyor.')}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
                    aria-label="Bildirimler"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </button>
                  <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 md:flex">
                    <div className="text-right">
                      <p className="max-w-44 truncate text-sm font-bold text-slate-800">
                        {user?.signInDetails?.loginId || user?.username}
                      </p>
                      <p className="text-xs font-medium text-slate-500">Admin</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl space-y-6">
                <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-blue-700">TicketMind Console</p>
                        <h2 className="mt-2 max-w-2xl text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                          Etkinlik, stok, medya ve bilet akışını tek yerden yönet.
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                          S3 afişleri, Cognito güvenliği, QR biletler ve AI fiyatlandırma hattı için üretim odaklı panel.
                        </p>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                        Hafta 7 tamamlandı
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard
                        icon={<Ticket className="h-5 w-5" />}
                        label="Aktif Etkinlik"
                        value={metrics.totalEvents}
                        detail="DynamoDB kayıtları"
                      />
                      <MetricCard
                        icon={<Gauge className="h-5 w-5" />}
                        label="Satılan Bilet"
                        value={metrics.soldTickets}
                        detail={`${metrics.totalCapacity || 0} toplam kapasite`}
                      />
                      <MetricCard
                        icon={<BarChart3 className="h-5 w-5" />}
                        label="Tahmini Ciro"
                        value={formatCurrency(metrics.estimatedRevenue)}
                        detail="Bilet fiyatı x satış"
                      />
                      <MetricCard
                        icon={<Bot className="h-5 w-5" />}
                        label="AI İzleme"
                        value={metrics.lowStockCount}
                        detail="Yüksek doluluk alarmı"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black text-slate-950">Sonraki Fazlar</h3>
                        <p className="mt-1 text-sm text-slate-500">Web arayüzüne hazır alanlar</p>
                      </div>
                      <Clock3 className="h-5 w-5 text-slate-400" />
                    </div>

                    <div className="mt-4 space-y-3">
                      <RoadmapRow title="AI dinamik fiyat motoru" week="Hafta 8" icon={<Sparkles />} />
                      <RoadmapRow title="Kişisel öneri listesi" week="Hafta 9" icon={<Bot />} />
                      <RoadmapRow title="Rate limit ve WAF görünümü" week="Hafta 10" icon={<ShieldCheck />} />
                      <RoadmapRow title="Organizatör analitiği" week="Hafta 11" icon={<BarChart3 />} />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">Etkinlik Yönetimi</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Stok, fiyat, kategori ve medya durumlarını takip et.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toast.info('Öneri endpointi Hafta 9 için ayrıldı.')}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Sparkles className="h-4 w-4 text-blue-700" />
                        Sana Özel
                      </button>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-black text-white transition-colors hover:bg-blue-800"
                      >
                        <Plus className="h-4 w-4" />
                        Etkinlik Oluştur
                      </button>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="grid gap-3 p-5">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />
                      ))}
                    </div>
                  ) : events.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-16 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Ticket className="h-7 w-7" />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-slate-950">Henüz etkinlik yok</h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                        İlk etkinliği oluşturduğunda SQS, DynamoDB ve S3 entegrasyonlarını bu panelden takip edebilirsin.
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-blue-800"
                      >
                        <Plus className="h-4 w-4" />
                        Etkinlik Oluştur
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[920px] text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <Th>Etkinlik</Th>
                            <Th>Tarih</Th>
                            <Th>Fiyat</Th>
                            <Th>Doluluk</Th>
                            <Th>AI Sinyali</Th>
                            <Th className="text-right">İşlem</Th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {events.map((event) => {
                            const fillRate = getFillRate(event);
                            const soldOut = event.availableTickets !== undefined && event.availableTickets <= 0;
                            const dynamicPrice = event.basePrice && event.basePrice !== event.price;

                            return (
                              <tr
                                key={event.id}
                                onClick={() => handleEventClick(event.id)}
                                className="cursor-pointer transition-colors hover:bg-blue-50/40"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600">
                                      {event.name?.slice(0, 2).toUpperCase() || 'ET'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="max-w-xs truncate font-black text-slate-950">{event.name}</p>
                                      <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                          {event.category || 'Genel'}
                                        </span>
                                        <span className="font-mono text-xs text-slate-400">
                                          {event.id.substring(0, 8)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {formatDate(event.date)}
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div>
                                    <p className="font-black text-slate-950">{formatCurrency(event.price)}</p>
                                    {dynamicPrice ? (
                                      <p className="text-xs font-medium text-slate-400 line-through">
                                        {formatCurrency(event.basePrice || 0)}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-slate-400">Baz fiyat</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="w-44">
                                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                                      <span>{fillRate}% dolu</span>
                                      <span>
                                        {event.availableTickets ?? 0}/{event.totalTickets ?? 0}
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100">
                                      <div
                                        className={`h-2 rounded-full ${
                                          soldOut ? 'bg-red-500' : fillRate >= 80 ? 'bg-amber-500' : 'bg-blue-700'
                                        }`}
                                        style={{ width: `${fillRate}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <StatusBadge
                                    tone={soldOut ? 'red' : dynamicPrice || fillRate >= 80 ? 'amber' : 'emerald'}
                                    label={soldOut ? 'Tükendi' : dynamicPrice ? 'Dinamik fiyat' : 'Stabil'}
                                  />
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEventClick(event.id);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-white hover:text-blue-700"
                                  >
                                    Detay
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Authenticator>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-slate-200">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function RoadmapMini({ icon, label, state }: { icon: ReactNode; label: string; state: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-700">
        <span className="text-blue-700">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <span className="rounded-md bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
        {state}
      </span>
    </div>
  );
}

function RoadmapRow({ icon, title, week }: { icon: ReactElement; title: string; week: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-slate-200">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-500">{week}</p>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'emerald' | 'amber' | 'red' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
  };

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-black ring-1 ${styles[tone]}`}>
      {label}
    </span>
  );
}

export default App;
