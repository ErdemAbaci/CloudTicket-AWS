import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { getMyTickets } from '../api';
import { X, Calendar, Ticket } from 'lucide-react';

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
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-slate-50 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-slate-900 flex items-center gap-3">
                                        <div className="bg-indigo-100 p-2 rounded-lg">
                                            <Ticket className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        Dijital Biletlerim
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : isError ? (
                                    <div className="text-red-500 text-center py-10 bg-red-50 rounded-xl border border-red-100">
                                        Biletleriniz yüklenirken bir hata oluştu.
                                    </div>
                                ) : tickets?.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Ticket className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 text-lg font-medium">Henüz biletiniz bulunmuyor.</p>
                                        <p className="text-slate-400 text-sm mt-1">Hemen bir etkinliğe katılıp bilet alın!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto p-2">
                                        {tickets?.map((ticket: MyTicket) => (
                                            <div key={ticket.ticketId} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-200 relative">
                                                {/* Bilet Üst Kısım (Header) */}
                                                <div className="bg-indigo-600 p-5 text-white">
                                                    <h4 className="font-bold text-lg leading-tight mb-2 line-clamp-2">
                                                        {ticket.eventName || "Bilinmeyen Etkinlik"}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-indigo-100 text-sm">
                                                        <Calendar className="w-4 h-4" />
                                                        {ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('tr-TR') : "-"}
                                                    </div>
                                                </div>

                                                {/* Kesik Bilet Efekti (Dashed Line) */}
                                                <div className="relative flex justify-between items-center bg-white h-8">
                                                    <div className="absolute -left-4 w-8 h-8 bg-slate-50 rounded-full"></div>
                                                    <div className="w-full border-t-2 border-dashed border-slate-200 mx-6 mt-4"></div>
                                                    <div className="absolute -right-4 w-8 h-8 bg-slate-50 rounded-full"></div>
                                                </div>

                                                {/* QR Kod Alanı */}
                                                <div className="p-6 flex flex-col items-center bg-white pt-2">
                                                    <div className="w-40 h-40 bg-slate-50 border border-slate-100 rounded-xl p-2 mb-4">
                                                        <img 
                                                            src={ticket.qrUrl} 
                                                            alt="Bilet QR Kodu" 
                                                            className="w-full h-full object-contain mix-blend-multiply"
                                                        />
                                                    </div>
                                                    
                                                    <div className="w-full bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Bilet ID</p>
                                                        <p className="font-mono text-xs text-slate-600 break-all">{ticket.ticketId}</p>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{ticket.status}</span>
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
