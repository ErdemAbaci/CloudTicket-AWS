import { useQuery } from '@tanstack/react-query';
import { getEvent } from '../api';
import { X, Calendar, Tag, Clock } from 'lucide-react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | null;
}

export default function EventDetailModal({ isOpen, onClose, eventId }: EventDetailModalProps) {
    const { data: event, isLoading, isError } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;
            const res = await getEvent(eventId);
            return res.data;
        },
        enabled: !!eventId && isOpen,
    });

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
                                        <div className="bg-indigo-50 p-4 rounded-xl">
                                            <h4 className="font-bold text-indigo-900 text-lg">{event.name}</h4>
                                            <p className="text-indigo-600 text-sm font-mono mt-1">{event.id}</p>
                                        </div>

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
                                                <div>
                                                    <p className="text-xs text-slate-400">Fiyat</p>
                                                    <p className="font-medium text-emerald-600">{event.price} ₺</p>
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

                                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-xl border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                onClick={onClose}
                                            >
                                                Tamam
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
