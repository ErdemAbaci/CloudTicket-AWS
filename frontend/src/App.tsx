import { useMemo, useState } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import {
  Calendar,
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  User,
  WalletCards,
} from 'lucide-react';
import { getEvents, getRecommendations } from './api';
import 'react-toastify/dist/ReactToastify.css';

import EventDetailModal from './components/EventDetailModal';
import MyTicketsModal from './components/MyTicketsModal';

interface EventData {
  id: string;
  name: string;
  date: string;
  price: number;
  basePrice?: number;
  pricingTrend?: 'discount' | 'surge' | 'stable';
  discountPercent?: number;
  pricingReason?: string;
  lastPriceUpdateAt?: string;
  availableTickets?: number;
  totalTickets?: number;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  recommendationReason?: string;
  recommendationScore?: number;
  recommendationSignals?: string[];
  aiConfidence?: number;
}

const categories = ['Tümü', 'Konser', 'Festival', 'Tiyatro', 'Stand-up', 'Spor'];

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

const formatLongDate = (value: string) =>
  new Date(value).toLocaleDateString('tr-TR', {
    weekday: 'long',
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

const getDiscountPercent = (event: EventData) => {
  if (event.discountPercent && event.discountPercent > 0) {
    return event.discountPercent;
  }

  if (event.basePrice && event.basePrice > event.price) {
    return Math.round(((event.basePrice - event.price) / event.basePrice) * 100);
  }

  return 0;
};

function App() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMyTicketsModalOpen, setIsMyTicketsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: events = [], isLoading } = useQuery<EventData[]>({
    queryKey: ['events', { searchTerm, selectedCategory }],
    queryFn: async () => {
      const response = await getEvents({
        search: searchTerm || undefined,
        category: selectedCategory === 'Tümü' ? undefined : selectedCategory,
        limit: 60,
      });
      return response.data;
    },
    enabled: !!user,
  });
  const { data: personalizedEvents = [], isLoading: isRecommendationsLoading } = useQuery<EventData[]>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await getRecommendations({ limit: 3 });
      return response.data;
    },
    enabled: !!user,
  });

  const filteredEvents = useMemo(() => {
    return events;
  }, [events]);

  const featuredEvent = filteredEvents[0] || events[0];
  const recommendedEvents = personalizedEvents.length > 0 ? personalizedEvents : filteredEvents.slice(0, 3);

  const handleExploreClick = () => {
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEventClick = (id: string) => {
    setSelectedEventId(id);
    setIsDetailModalOpen(true);
  };

  return (
    <Authenticator>
      <div className="min-h-screen bg-[#F7F4EF] font-sans text-slate-950">
        <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />

        <EventDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          eventId={selectedEventId}
        />
        <MyTicketsModal isOpen={isMyTicketsModalOpen} onClose={() => setIsMyTicketsModalOpen(false)} />

        <header className="sticky top-0 z-30 border-b border-white/70 bg-[#F7F4EF]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-black leading-none text-slate-950">TicketMind</p>
                <p className="mt-1 text-xs font-bold text-slate-500">Etkinlik keşfi</p>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
              <a href="#events" className="transition-colors hover:text-slate-950">
                Etkinlikler
              </a>
              <button
                onClick={() => setIsMyTicketsModalOpen(true)}
                className="transition-colors hover:text-slate-950"
              >
                Biletlerim
              </button>
              <a href="#recommended" className="transition-colors hover:text-slate-950">
                Sana Özel
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMyTicketsModalOpen(true)}
                aria-label="Biletlerim"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-black text-slate-800 shadow-sm transition-all hover:bg-white"
              >
                <WalletCards className="h-4 w-4" />
                <span className="hidden sm:inline">Biletlerim</span>
              </button>
              <button
                onClick={signOut}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition-all hover:bg-white hover:text-red-700"
                aria-label="Çıkış yap"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:pb-14 lg:pt-12">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
                <Sparkles className="h-4 w-4" />
                AI destekli öneriler aktif
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Şehirdeki iyi anları kaçırma.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Konser, festival, sahne ve spor etkinliklerini sakin, hızlı ve güvenli bir deneyimle keşfet.
                Biletini al, QR kodunu yanında taşı.
              </p>

              <div className="mt-7 rounded-[28px] border border-white bg-white/80 p-2 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex min-h-12 flex-1 items-center gap-3 rounded-full bg-slate-50 px-4">
                    <Search className="h-5 w-5 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Etkinlik, kategori veya etiket ara"
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    onClick={handleExploreClick}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition-colors hover:bg-slate-800"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Keşfet
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-black transition-all ${
                      selectedCategory === category
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-300/60'
                        : 'bg-white/70 text-slate-600 ring-1 ring-white hover:bg-white hover:text-slate-950'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <FeaturedEvent event={featuredEvent} isLoading={isLoading} onOpen={handleEventClick} />
          </section>

          <section id="recommended" className="border-y border-white/80 bg-white/55">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-slate-500">Sana Özel</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Bugün öne çıkanlar</h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-slate-500">
                  Geçmiş biletlerin, kategori tercihlerin ve etiketlere göre seçilen yaklaşan etkinlikler.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {(isRecommendationsLoading ? [undefined, undefined, undefined] : recommendedEvents).map((event, index) => (
                  <SoftRecommendation key={event?.id || index} event={event} onOpen={handleEventClick} />
                ))}
              </div>
            </div>
          </section>

          <section id="events" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-slate-500">Etkinlikler</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Yaklaşan deneyimler</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-slate-500 ring-1 ring-white">
                <User className="h-4 w-4" />
                {user?.signInDetails?.loginId || user?.username}
              </div>
            </div>

            {isLoading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="h-80 animate-pulse rounded-[28px] bg-white/70" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="mt-6 rounded-[28px] border border-white bg-white/75 px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-950">Uygun etkinlik bulunamadı</h3>
                <p className="mt-2 text-sm text-slate-500">Aramayı veya kategori filtresini değiştirerek tekrar dene.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} onOpen={handleEventClick} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </Authenticator>
  );
}

function FeaturedEvent({
  event,
  isLoading,
  onOpen,
}: {
  event?: EventData;
  isLoading: boolean;
  onOpen: (id: string) => void;
}) {
  if (isLoading) {
    return <div className="min-h-[460px] animate-pulse rounded-[36px] bg-white/70" />;
  }

  if (!event) {
    return (
      <div className="flex min-h-[460px] items-center justify-center rounded-[36px] border border-white bg-white/70 p-8 text-center shadow-sm">
        <div>
          <Ticket className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-black text-slate-700">Henüz etkinlik yok</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpen(event.id)}
      className="group relative min-h-[460px] overflow-hidden rounded-[36px] border border-white bg-slate-950 text-left shadow-[0_32px_90px_rgba(15,23,42,0.18)]"
    >
      {event.imageUrl ? (
        <img
          src={`${import.meta.env.VITE_MEDIA_BUCKET_URL}/${event.imageUrl}`}
          alt={event.name}
          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#93c5fd_0,#1e3a8a_28%,#0f172a_70%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

      <div className="relative flex h-full min-h-[460px] flex-col justify-between p-7 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-slate-950">
            {event.category || 'Öne çıkan'}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
            {getRemainingLabel(event)}
          </span>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white/80">
            <Calendar className="h-4 w-4" />
            {formatLongDate(event.date)}
          </p>
          <h2 className="max-w-xl text-4xl font-black leading-tight tracking-tight">{event.name}</h2>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PricePill event={event} tone="light" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur">
              Detayları gör
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function SoftRecommendation({ event, onOpen }: { event?: EventData; onOpen: (id: string) => void }) {
  if (!event) {
    return <div className="h-40 animate-pulse rounded-[24px] bg-white/80" />;
  }

  return (
    <button
      onClick={() => onOpen(event.id)}
      className="group rounded-[24px] border border-white bg-white/85 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF6F1] text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <Heart className="h-5 w-5 text-slate-300 transition-colors group-hover:text-rose-400" />
      </div>
      <h3 className="mt-5 line-clamp-2 text-lg font-black text-slate-950">{event.name}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-500">{formatDate(event.date)}</p>
      {event.recommendationReason && (
        <p className="mt-3 line-clamp-2 text-xs font-bold leading-5 text-emerald-700">{event.recommendationReason}</p>
      )}
      {event.aiConfidence !== undefined && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            AI güveni %{Math.round(event.aiConfidence * 100)}
          </span>
          {event.recommendationSignals?.[0] && (
            <span className="line-clamp-1 text-[11px] font-bold text-slate-500">{event.recommendationSignals[0]}</span>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
          {event.category || 'Genel'}
        </span>
        <CompactPrice event={event} />
      </div>
    </button>
  );
}

function EventCard({ event, onOpen }: { event: EventData; onOpen: (id: string) => void }) {
  const discountPercent = getDiscountPercent(event);

  return (
    <button
      onClick={() => onOpen(event.id)}
      className="group overflow-hidden rounded-[28px] border border-white bg-white/85 text-left shadow-sm transition-all hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/80"
    >
      <div className="relative h-48 overflow-hidden bg-slate-200">
        {event.imageUrl ? (
          <img
            src={`${import.meta.env.VITE_MEDIA_BUCKET_URL}/${event.imageUrl}`}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 via-emerald-50 to-amber-100">
            <Ticket className="h-12 w-12 text-slate-400" />
          </div>
        )}
        {discountPercent > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-sm">
            %{discountPercent} indirim
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-center shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase text-slate-500">
            {new Date(event.date).toLocaleDateString('tr-TR', { month: 'short' })}
          </p>
          <p className="text-xl font-black leading-none text-slate-950">
            {new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              {event.category || 'Genel'}
            </span>
            <h3 className="mt-3 line-clamp-2 text-xl font-black leading-snug text-slate-950">{event.name}</h3>
          </div>
          <Heart className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-rose-400" />
        </div>

        <div className="mt-4 space-y-2 text-sm font-semibold text-slate-500">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(event.date)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            TicketMind sahnesi
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400">Başlayan fiyat</p>
            <PriceStack event={event} />
          </div>
          <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
            İncele
          </span>
        </div>
      </div>
    </button>
  );
}

function PricePill({ event, tone = 'dark' }: { event: EventData; tone?: 'dark' | 'light' }) {
  const discountPercent = getDiscountPercent(event);

  if (discountPercent > 0) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">
        <span>{formatCurrency(event.price)}</span>
        <span className="text-xs text-slate-400 line-through">{formatCurrency(event.basePrice || event.price)}</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
          %{discountPercent} indirim
        </span>
      </span>
    );
  }

  return (
    <span className={`rounded-full px-4 py-2 text-sm font-black ${tone === 'light' ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-950'}`}>
      {formatCurrency(event.price)}
    </span>
  );
}

function CompactPrice({ event }: { event: EventData }) {
  const discountPercent = getDiscountPercent(event);

  return (
    <span className="text-right">
      <span className="block text-sm font-black text-slate-950">{formatCurrency(event.price)}</span>
      {discountPercent > 0 && (
        <span className="block text-[11px] font-black text-emerald-700">
          %{discountPercent} fiyat dustu
        </span>
      )}
    </span>
  );
}

function PriceStack({ event }: { event: EventData }) {
  const discountPercent = getDiscountPercent(event);

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg font-black text-slate-950">{formatCurrency(event.price)}</p>
        {discountPercent > 0 && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
            %{discountPercent}
          </span>
        )}
      </div>
      {discountPercent > 0 && (
        <p className="mt-0.5 text-xs font-bold text-slate-400">
          <span className="line-through">{formatCurrency(event.basePrice || event.price)}</span>
          <span className="ml-2 text-emerald-700">fiyat düştü</span>
        </p>
      )}
    </div>
  );
}

export default App;
