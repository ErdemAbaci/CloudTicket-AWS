import type { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    color?: 'indigo' | 'emerald' | 'purple' | 'blue';
}

export default function StatsCard({ title, value, icon, trend, color = 'indigo' }: StatsCardProps) {
    const colorStyles = {
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
        purple: 'from-purple-500 to-purple-600 shadow-purple-200',
        blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    };

    return (
        <div className={`bg-gradient-to-br ${colorStyles[color]} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group`}>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-white/80 text-sm font-medium">{title}</p>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        {icon}
                    </div>
                </div>
                <h3 className="text-3xl font-bold">{value}</h3>
                {trend && <p className="text-white/60 text-xs mt-2">{trend}</p>}
            </div>

            {/* Decorative Circle */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        </div>
    );
}
