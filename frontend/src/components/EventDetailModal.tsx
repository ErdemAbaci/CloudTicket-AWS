import { useQuery } from '@tanstack/react-query';
import { getEvent, purchaseTicket } from '../api';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { X, Calendar, Tag, Clock } from 'lucide-react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | null;
}

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
            toast.success("Bilet başarıyla alındı!");
            refetch(); // Stok bilgisini tazelemek için
        } catch {
            // Toast api.ts içerisinde global olarak hallediliyor
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                        Etkinlik Detayı
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : isError ? (
                                    <div className="text-red-500 text-center py-4">
                                        Etkinlik detayları yüklenemedi.
                                    </div>
                                ) : event ? (
                                    <div className="space-y-4">
                                        {event.imageUrl && (
                                            <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-slate-100 flex-shrink-0">
                                                <img 
                                                    src={`${import.meta.env.VITE_MEDIA_BUCKET_URL}/${event.imageUrl}`} 
                                                    alt={event.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="bg-indigo-50 p-4 rounded-xl flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-indigo-900 text-lg">{event.name}</h4>
                                                    {event.category && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-800 uppercase tracking-wider">
                                                            {event.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-indigo-600 text-xs font-mono">{event.id}</p>
                                            </div>
                                        </div>

                                        {event.tags && event.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {event.tags.map((tag: string, index: number) => (
                                                    <span key={index} className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Calendar className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Tarih</p>
                                                    <p className="font-medium">
                                                        {new Date(event.date).toLocaleDateString('tr-TR', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Tag className="w-5 h-5 text-slate-400" />
                                                <div className="flex flex-col">
                                                    <p className="text-xs text-slate-400">Fiyat</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="font-bold text-emerald-600 text-lg">{event.price} ₺</p>
                                                        {event.basePrice && event.basePrice !== event.price && (
                                                            <p className="text-xs text-slate-400 line-through">{event.basePrice} ₺</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Clock className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Oluşturulma Tarihi</p>
                                                    <p className="font-medium text-sm">
                                                        {event.createdAt ? new Date(event.createdAt).toLocaleString('tr-TR') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-xl border border-transparent bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                                                onClick={onClose}
                                            >
                                                Kapat
                                            </button>
                                            
                                            <button
                                                type="button"
                                                disabled={isPurchasing || (event.availableTickets !== undefined && event.availableTickets <= 0)}
                                                className="inline-flex justify-center rounded-xl border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={handlePurchase}
                                            >
                                                {isPurchasing ? 'İşleniyor...' : (event.availableTickets !== undefined && event.availableTickets <= 0 ? 'Tükendi' : 'Bilet Satın Al')}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
