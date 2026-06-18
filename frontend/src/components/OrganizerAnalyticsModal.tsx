import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, Layers3, Ticket, TrendingUp, Wallet, X } from 'lucide-react';

import { getAnalyticsOverview } from '../api';
import StatsCard from './StatsCard';

interface OrganizerAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: () => void;
}

interface AnalyticsOverview {
  totalRevenue: number;
  soldTickets: number;
  averageTicketPrice: number;
  uniqueEventsSold: number;
  topCategory?: {
    category: string;
    soldTickets: number;
    revenue: number;
  };
  topCategories: Array<{
    category: string;
    soldTickets: number;
    revenue: number;
  }>;
  topEvents: Array<{
    eventId: string;
    soldTickets: number;
    revenue: number;
  }>;
  daily: Array<{
    date: string;
    revenue: number;
    soldTickets: number;
  }>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);

export default function OrganizerAnalyticsModal({
  isOpen,
  onClose,
  onCreateEvent,
}: OrganizerAnalyticsModalProps) {
  const { data, isLoading, isError } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await getAnalyticsOverview();
      return response.data;
    },
    enabled: isOpen,
  });

  const maxRevenue = Math.max(...(data?.daily.map((item) => item.revenue) || [1]));

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-3 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-[32px] border border-white bg-[#F7F4EF] p-4 text-left align-middle shadow-[0_32px_100px_rgba(15,23,42,0.28)] transition-all">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-slate-500">Organizatör Analitiği</p>
                    <Dialog.Title as="h3" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      Satış ve gelir özeti
                    </Dialog.Title>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Satılan biletlerden türetilen ciro, kategori ve günlük satış eğilimleri.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onCreateEvent}
                      className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                    >
                      Yeni Etkinlik
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Kapat"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-950"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-36 animate-pulse rounded-[24px] bg-white/80" />
                    ))}
                  </div>
                ) : isError || !data ? (
                  <div className="rounded-[28px] border border-red-100 bg-red-50 px-6 py-16 text-center font-bold text-red-600">
                    Analitik verisi şu anda yüklenemedi.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <StatsCard title="Toplam Ciro" value={formatCurrency(data.totalRevenue)} icon={<Wallet className="h-5 w-5" />} color="emerald" />
                      <StatsCard title="Satılan Bilet" value={data.soldTickets} icon={<Ticket className="h-5 w-5" />} color="blue" />
                      <StatsCard title="Ort. Bilet Fiyatı" value={formatCurrency(data.averageTicketPrice)} icon={<TrendingUp className="h-5 w-5" />} color="indigo" />
                      <StatsCard title="Satış Görülen Etkinlik" value={data.uniqueEventsSold} icon={<Layers3 className="h-5 w-5" />} color="purple" />
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                      <section className="rounded-[28px] border border-white bg-white/85 p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-slate-950">Son 7 Gün Gelir Akışı</h4>
                            <p className="mt-1 text-sm text-slate-500">Günlük gelir ve satılan bilet sayısı</p>
                          </div>
                          <CalendarDays className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="mt-6 grid grid-cols-7 gap-3">
                          {data.daily.map((item) => (
                            <div key={item.date} className="flex flex-col items-center gap-3">
                              <div className="flex h-44 items-end">
                                <div
                                  className="w-8 rounded-t-2xl bg-gradient-to-t from-emerald-500 to-emerald-300"
                                  style={{ height: `${Math.max(12, (item.revenue / maxRevenue) * 176)}px` }}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-[11px] font-black text-slate-500">
                                  {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className="mt-1 text-xs font-bold text-slate-700">{formatCurrency(item.revenue)}</p>
                                <p className="text-[11px] text-slate-400">{item.soldTickets} bilet</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-5">
                        <div className="rounded-[28px] border border-white bg-white/85 p-6 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-black text-slate-950">En Güçlü Kategori</h4>
                              <p className="mt-1 text-sm text-slate-500">Gelir ve satış hacmine göre</p>
                            </div>
                            <BarChart3 className="h-5 w-5 text-slate-400" />
                          </div>

                          {data.topCategory ? (
                            <div className="mt-5 rounded-[24px] bg-[#F7F4EF] p-5">
                              <p className="text-xl font-black text-slate-950">{data.topCategory.category}</p>
                              <p className="mt-2 text-sm font-bold text-slate-500">{data.topCategory.soldTickets} bilet satıldı</p>
                              <p className="mt-1 text-sm font-bold text-emerald-700">{formatCurrency(data.topCategory.revenue)} ciro</p>
                            </div>
                          ) : (
                            <p className="mt-5 text-sm text-slate-500">Henüz satış verisi bulunmuyor.</p>
                          )}
                        </div>

                        <div className="rounded-[28px] border border-white bg-white/85 p-6 shadow-sm">
                          <h4 className="text-lg font-black text-slate-950">Kategori Kırılımı</h4>
                          <div className="mt-5 space-y-4">
                            {data.topCategories.map((item) => (
                              <div key={item.category}>
                                <div className="mb-1 flex items-center justify-between text-sm font-bold text-slate-700">
                                  <span>{item.category}</span>
                                  <span>{item.soldTickets} bilet</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-slate-950"
                                    style={{ width: `${Math.max(8, (item.soldTickets / Math.max(...data.topCategories.map((entry) => entry.soldTickets), 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
