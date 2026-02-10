import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent } from '../api';
import { toast } from 'react-toastify';
import { X, Calendar, DollarSign, Type } from 'lucide-react';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ name: '', date: '', price: '' });

    const createTicketMutation = useMutation({
        mutationFn: async (newTicket: { name: string; date: string; price: number }) => {
            return createEvent(newTicket);
        },
        onSuccess: () => {
            toast.success('Etkinlik oluşturma talebi kuyruğa alındı (202 Accepted). Listeye birazdan düşecek.');
            setFormData({ name: '', date: '', price: '' });
            onClose();
            // Asenkron işlem olduğu için biraz bekleyip listeyi yenile
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['events'] });
            }, 2000);
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['events'] });
            }, 5000);
        },
        onError: () => {
            toast.error('Etkinlik oluşturulurken bir hata oluştu.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.date || !formData.price) {
            toast.warning('Lütfen tüm alanları doldurun.');
            return;
        }
        createTicketMutation.mutate({
            name: formData.name,
            date: formData.date,
            price: Number(formData.price),
        });
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
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                        Yeni Etkinlik Oluştur
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Etkinlik Adı</label>
                                        <div className="relative">
                                            <Type className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="Örn: Yaz Konseri"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Tarih</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                            <input
                                                type="date"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-600"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Fiyat (TL)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                            <input
                                                type="number"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <button
                                            type="submit"
                                            disabled={createTicketMutation.isPending}
                                            className="w-full inline-flex justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {createTicketMutation.isPending ? 'Kuyruğa Gönderiliyor...' : 'Oluştur (POST /event)'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
