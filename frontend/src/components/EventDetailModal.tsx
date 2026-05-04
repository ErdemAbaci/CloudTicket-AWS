import { Fragment, useState, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Calendar, Clock, MapPin, Tag, X } from 'lucide-react';

import { getEvent, purchaseTicket } from '../api';

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | null;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
    }).format(value);

export default function EventDetailModal({ isOpen, onClose, eventId }: EventDetailModalProps) {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { data: event, isLoading, isError, refetch } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;
            const res = await getEvent(eventId);
            return res.data;
        },
        enabled: !!eventId && isOpen,
    });

    const handlePurchase = async () => {
        if (!eventId) return;
        setIsPurchasing(true);
        try {
            await purchaseTicket(eventId);
            toast.success('Bilet başarıyla alındı!');
            refetch();
        } catch {
            // Toast api.ts içinde global olarak gösteriliyor.
        } finally {
            setIsPurchasing(false);
        }
    };

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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[32px] border border-white bg-[#F7F4EF] p-3 text-left align-middle shadow-[0_32px_100px_rgba(15,23,42,0.28)] transition-all">
                                <div className="overflow-hidden rounded-[26px] bg-white/90">
                                    <div className="relative min-h-60 bg-slate-950">
                                        {event?.imageUrl ? (
                                            <img
                                                src={`${import.meta.env.VITE_MEDIA_BUCKET_URL}/${event.imageUrl}`}
                                                alt={event.name}
                                                className="absolute inset-0 h-full w-full object-cover opacity-80"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#bfdbfe_0,#475569_35%,#0f172a_76%)]" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            aria-label="Kapat"
                                            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-slate-950"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>

                                        <div className="relative flex min-h-60 flex-col justify-end p-6 text-white">
                                            <div className="mb-3 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-950">
                                                    {event?.category || 'Etkinlik'}
                                                </span>
                                                {event?.availableTickets !== undefined && (
                                                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                                                        {event.availableTickets <= 0 ? 'Tükendi' : `${event.availableTickets} bilet kaldı`}
                                                    </span>
                                                )}
                                            </div>
                                            <Dialog.Title as="h3" className="text-3xl font-black leading-tight tracking-tight">
                                                {event?.name || 'Etkinlik Detayı'}
                                            </Dialog.Title>
                                        </div>
                                    </div>

                                    {isLoading ? (
                                        <div className="flex justify-center py-16">
                                            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
                                        </div>
                                    ) : isError ? (
                                        <div className="m-5 rounded-[22px] border border-red-100 bg-red-50 px-5 py-10 text-center font-bold text-red-600">
                                            Etkinlik detayları yüklenemedi.
                                        </div>
                                    ) : event ? (
                                        <div className="space-y-5 p-5">
                                            {event.tags && event.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {event.tags.map((tag: string, index: number) => (
                                                        <span
                                                            key={index}
                                                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <InfoItem
                                                    icon={<Calendar className="h-5 w-5" />}
                                                    label="Tarih"
                                                    value={new Date(event.date).toLocaleDateString('tr-TR', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                />
                                                <InfoItem
                                                    icon={<MapPin className="h-5 w-5" />}
                                                    label="Mekan"
                                                    value="TicketMind sahnesi"
                                                />
                                                <InfoItem
                                                    icon={<Tag className="h-5 w-5" />}
                                                    label="Başlayan fiyat"
                                                    value={formatCurrency(event.price)}
                                                    helper={
                                                        event.basePrice && event.basePrice !== event.price
                                                            ? `${formatCurrency(event.basePrice)} baz fiyat`
                                                            : 'Güncel satış fiyatı'
                                                    }
                                                />
                                                <InfoItem
                                                    icon={<Clock className="h-5 w-5" />}
                                                    label="Oluşturulma"
                                                    value={event.createdAt ? new Date(event.createdAt).toLocaleString('tr-TR') : '-'}
                                                />
                                            </div>

                                            <div className="rounded-[24px] bg-[#F7F4EF] p-4">
                                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Etkinlik ID</p>
                                                <p className="mt-1 break-all font-mono text-xs font-bold text-slate-600">{event.id}</p>
                                            </div>

                                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"
                                                    onClick={onClose}
                                                >
                                                    Kapat
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isPurchasing || (event.availableTickets !== undefined && event.availableTickets <= 0)}
                                                    className="inline-flex justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                    onClick={handlePurchase}
                                                >
                                                    {isPurchasing
                                                        ? 'İşleniyor...'
                                                        : event.availableTickets !== undefined && event.availableTickets <= 0
                                                            ? 'Tükendi'
                                                            : 'Bilet Satın Al'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

function InfoItem({
    icon,
    label,
    value,
    helper,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    helper?: string;
}) {
    return (
        <div className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                {icon}
            </div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
            {helper && <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>}
        </div>
    );
}
