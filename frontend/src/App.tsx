import { useState } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useQuery } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import {
  Ticket,
  LogOut,
  LayoutDashboard,
  Search,
  Bell,
  User,
  Plus,
  Calendar,
  MoreVertical,
  Layers,
  Activity
} from 'lucide-react';
import api from './api';
import 'react-toastify/dist/ReactToastify.css';

// Components
import HealthCheck from './components/HealthCheck';
import StatsCard from './components/StatsCard';
import CreateEventModal from './components/CreateEventModal';
import EventDetailModal from './components/EventDetailModal';

interface TicketData {
  id: string; // Backend uses 'id'
  name: string;
  date: string;
  price: number;
}

function App() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data;
    },
    enabled: !!user,
  });

  const handleEventClick = (id: string) => {
    setSelectedEventId(id);
    setIsDetailModalOpen(true);
  };

  return (

    <Authenticator>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
        <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />

        {/* Modals */}
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <EventDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          eventId={selectedEventId}
        />

        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-10">
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
              <Layers className="text-white w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800 block leading-none">CloudTicket</span>
              <span className="text-xs text-slate-400 font-medium tracking-wide">BACKEND VISUALIZER</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Platform</div>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl font-medium transition-colors">
              <Search className="w-5 h-5" />
              API Explorer
            </button>

            <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">System</div>
            <div className="px-4 py-2">
              <HealthCheck />
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl cursor-pointer transition-colors"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">

          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8 shadow-sm">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-slate-800">API Genel Bakış</h1>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                {import.meta.env.VITE_API_URL || 'API URL Not Set'}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-700">{user?.signInDetails?.loginId || user?.username}</p>
                  <p className="text-xs text-slate-400">Developer</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8">

            <div className="max-w-7xl mx-auto space-y-8">

              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Toplam Etkinlik (GET /events)"
                  value={tickets?.length || 0}
                  icon={<Ticket className="w-6 h-6 text-white" />}
                  color="indigo"
                />
                <StatsCard
                  title="Sistem Durumu (GET /hello)"
                  value="Aktif"
                  icon={<Activity className="w-6 h-6 text-white" />}
                  color="emerald"
                  trend="Latency: 45ms"
                />
                <StatsCard
                  title="Kuyruk Durumu (SQS)"
                  value="Bekleyen: 0"
                  icon={<Layers className="w-6 h-6 text-white" />}
                  color="purple"
                />
              </div>

              {/* Events Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Etkinlik Listesi</h2>
                    <p className="text-slate-500 text-sm">DynamoDB'den çekilen etkinlikler.</p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni Etkinlik (POST)
                  </button>
                </div>

                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-400">Veriler yükleniyor...</p>
                  </div>
                ) : tickets?.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ticket className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium">Veri bulunamadı</p>
                    <p className="text-sm">Yeni bir etkinlik oluşturarak API'yi test edin.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Etkinlik ID</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">İsim</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fiyat</th>
                          <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tickets?.map((ticket: TicketData) => (
                          <tr
                            key={ticket.id}
                            onClick={() => handleEventClick(ticket.id)}
                            className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 group-hover:bg-white transition-colors">
                                {ticket.id.substring(0, 8)}...
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800">{ticket.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-600 text-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {new Date(ticket.date).toLocaleDateString('tr-TR')}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {ticket.price} ₺
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </Authenticator>
  );

}

export default App;
