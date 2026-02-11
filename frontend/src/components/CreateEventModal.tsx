import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, getUploadUrl, uploadFileToS3 } from '../api';
import { toast } from 'react-toastify';
import { X, Calendar, DollarSign, Type, Upload } from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ name: '', date: '', price: '' });
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.date || !formData.price) {
            toast.warning('Lütfen tüm alanları doldurun.');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Token al
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (!token) {
                toast.error('Oturum bilgisi alınamadı.');
                return;
            }

            let imageKey = undefined;

            // 2. Dosya varsa yükle
            if (file) {
                // A. Presigned URL al
                const { uploadUrl, key } = await getUploadUrl(token, file.type);

                // B. Dosyayı S3'e yükle
                await uploadFileToS3(uploadUrl, file);

                imageKey = key;
            }

            // 3. Etkinliği oluştur (resim key'i ile)
            await createEvent({
                name: formData.name,
                date: formData.date,
                price: Number(formData.price),
                imageUrl: imageKey,
            } as any); // Type casting for quick fix, better to update api type definition

            toast.success('Etkinlik oluşturma talebi kuyruğa alındı (202 Accepted).');
            setFormData({ name: '', date: '', price: '' });
            setFile(null);
            onClose();

            // Listeyi yenile
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['events'] });
            }, 2000);
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['events'] });
            }, 5000);

        } catch (error) {
            console.error(error);
            toast.error('İşlem sırasında bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
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

                                    {/* DOSYA YÜKLEME ALANI */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Afiş Görseli</label>
                                        <div
                                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all cursor-pointer relative group
                                                ${file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <div className="space-y-1 text-center">
                                                {file ? (
                                                    <div className="text-sm text-slate-600 flex flex-col items-center">
                                                        <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                                                            <Upload className="w-6 h-6 text-indigo-600" />
                                                        </div>
                                                        <span className="font-medium text-indigo-700">{file.name}</span>
                                                        <span className="text-xs text-slate-500">Değiştirmek için tıklayın</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                                            <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                        </div>
                                                        <div className="flex text-sm text-slate-600 justify-center mt-2">
                                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                                <span>Dosya Seç</span>
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG (max 10MB)</p>
                                                    </>
                                                )}
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setFile(e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full inline-flex justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    İşleniyor...
                                                </span>
                                            ) : 'Oluştur'}
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
