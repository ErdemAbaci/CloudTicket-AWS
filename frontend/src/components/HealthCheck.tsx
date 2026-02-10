import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../api';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export default function HealthCheck() {
    const { data, isError, isLoading } = useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const res = await getHealth();
            return res.data;
        },
        refetchInterval: 30000,
        retry: false,
    });

    if (isLoading) return <Activity className="w-5 h-5 text-slate-400 animate-pulse" />;

    if (isError) {
        return (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-1.5 rounded-full text-xs font-bold border border-red-100">
                <WifiOff className="w-4 h-4" />
                <span>Sistem Hatası</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
            <Wifi className="w-4 h-4" />
            <span>Sistem Aktif</span>
            <span className="hidden sm:inline text-emerald-400 font-normal">| {data?.message || 'OK'}</span>
        </div>
    );
}
