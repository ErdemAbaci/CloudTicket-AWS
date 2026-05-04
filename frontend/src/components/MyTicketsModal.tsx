import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, QrCode, Ticket, X } from 'lucide-react';

import { getMyTickets } from '../api';

interface MyTicketsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MyTicket {
    ticketId: string;
    eventId: string;
    eventName: string;
    eventDate: string;
    purchasedAt: string;
    qrUrl: string;
    status: string;
}

const getStatusLabel = (status: string) => {
    const normalized = status?.toLowerCase();

    if (normalized === 'used') return 'Kullanıldı';
    if (normalized === 'cancelled') return 'İptal';

    return 'Aktif';
};

export default function MyTicketsModal({ isOpen, onClose }: MyTicketsModalProps) {
    const { data: tickets, isLoading, isError } = useQuery({
        queryKey: ['my-tickets'],
        queryFn: async () => {
            const res = await getMyTickets();
            return res.data;
        },
        enabled: isOpen,
    });

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
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-[32px] border border-white bg-[#F7F4EF] p-4 text-left align-middle shadow-[0_32px_100px_rgba(15,23,42,0.28)] transition-all">
                                <div className="mb-5 flex items-start justify-between gap-4 px-2 pt-1">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-wide text-slate-500">Dijital cüzdan</p>
                                        <Dialog.Title as="h3" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                                            Biletlerim
                                        </Dialog.Title>
                                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                                            QR kodların ve giriş bilgilerin burada. Etkinlik girişinde ilgili bileti okutman yeterli.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Kapat"
                                        className="z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-950"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
                                    </div>
                                ) : isError ? (
                                    <div className="rounded-[28px] border border-red-100 bg-red-50 px-6 py-16 text-center font-bold text-red-600">
                                        Biletleriniz yüklenirken bir hata oluştu.
                                    </div>
                                ) : tickets?.length === 0 ? (
                                    <div className="rounded-[28px] border border-white bg-white/85 px-6 py-16 text-center shadow-sm">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                            <Ticket className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="mt-4 text-lg font-black text-slate-950">Henüz biletiniz bulunmuyor.</p>
                                        <p className="mt-1 text-sm text-slate-500">Bir etkinlik seçip bilet aldığınızda QR kodunuz burada görünecek.</p>
                                    </div>
                                ) : (
                                    <div className="grid max-h-[66vh] grid-cols-1 gap-5 overflow-y-auto pr-1 md:grid-cols-2 lg:grid-cols-3">
                                        {tickets?.map((ticket: MyTicket) => (
                                            <div
                                                key={ticket.ticketId}
                                                className="overflow-hidden rounded-[28px] border border-white bg-white/90 shadow-sm"
                                            >
                                                <div className="p-5">
                                                    <div className="mb-4 flex items-start justify-between gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                                            <Ticket className="h-5 w-5" />
                                                        </div>
                                                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                                                            {getStatusLabel(ticket.status)}
                                                        </span>
                                                    </div>

                                                    <h4 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
                                                        {ticket.eventName || 'Bilinmeyen Etkinlik'}
                                                    </h4>
                                                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                                        <Calendar className="h-4 w-4" />
                                                        {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('tr-TR') : '-'}
                                                    </div>
                                                </div>

                                                <div className="relative flex h-8 items-center bg-white">
                                                    <div className="absolute -left-4 h-8 w-8 rounded-full bg-[#F7F4EF]" />
                                                    <div className="mx-6 w-full border-t border-dashed border-slate-200" />
                                                    <div className="absolute -right-4 h-8 w-8 rounded-full bg-[#F7F4EF]" />
                                                </div>

                                                <div className="flex flex-col items-center px-5 pb-5">
                                                    <div className="flex h-44 w-44 items-center justify-center rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
                                                        {ticket.qrUrl ? (
                                                            <img
                                                                src={ticket.qrUrl}
                                                                alt="Bilet QR Kodu"
                                                                className="h-full w-full object-contain mix-blend-multiply"
                                                            />
                                                        ) : (
                                                            <QrCode className="h-20 w-20 text-slate-300" />
                                                        )}
                                                    </div>

                                                    <div className="mt-4 w-full rounded-[20px] bg-[#F7F4EF] p-3 text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bilet ID</p>
                                                        <p className="mt-1 break-all font-mono text-xs font-bold text-slate-600">{ticket.ticketId}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
