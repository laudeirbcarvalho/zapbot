"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAttendantAuth } from "@/app/lib/attendant-auth-middleware";
import { Users, TrendingUp, Clock, CheckCircle, AlertTriangle, XCircle, Settings, BarChart3 } from "lucide-react";

interface AttendantData {
  id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  type: string;
}

interface LeadStats {
  totalLeads: number;
  activeLeads: number;
  closedLeads: number;
  lostLeads: number;
  urgentLeads: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  leadsByStatus: { status: string; count: number }[];
  columnStats: { columnId: string; columnTitle: string; columnColor: string; count: number }[];
  urgentLeadsList: any[];
  recentActivity: any[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-700">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${color} rounded-md flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-400 truncate">{title}</dt>
            <dd className="text-2xl font-bold text-white">{value}</dd>
            {subtitle && <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export default function AttendantDashboard() {
  const [attendant, setAttendant] = useState<AttendantData | null>(null);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();
  const { checkSession, logout } = useAttendantAuth();

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/attendant/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const verifySession = async () => {
      const attendantData = await checkSession();
      if (attendantData) {
        setAttendant(attendantData);
        await fetchStats();
      } else {
        router.push("/attendant/login");
      }
      setLoading(false);
    };
    verifySession();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/attendant/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!attendant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">
                Dashboard do Atendente
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                <span className="font-medium">{attendant.name}</span>
                {attendant.position && (
                  <span className="ml-2 text-gray-400">({attendant.position})</span>
                )}
              </div>
              <button
                onClick={() => router.push('/attendant/profile')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <Settings className="w-4 h-4 mr-1" />
                Perfil
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Ações Rápidas - Cards em Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden shadow-lg rounded-lg border border-blue-500">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                      <Users className="w-7 h-7 text-blue-800" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-blue-100 truncate">
                        Gerenciar Leads
                      </dt>
                      <dd className="text-xl font-bold text-white">
                        Lista Completa
                      </dd>
                      <dd className="text-sm text-blue-100 mt-1">
                        Visualize e gerencie todos os seus leads
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => router.push("/attendant/leads")}
                    className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg"
                  >
                    Acessar Leads
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 overflow-hidden shadow-lg rounded-lg border border-green-500">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-green-800" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-green-100 truncate">
                        Quadro Kanban
                      </dt>
                      <dd className="text-xl font-bold text-white">
                        Pipeline Visual
                      </dd>
                      <dd className="text-sm text-green-100 mt-1">
                        Organize leads por etapas do funil
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => router.push("/attendant/kanban")}
                    className="w-full bg-green-800 hover:bg-green-900 text-white py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg"
                  >
                    Acessar Kanban
                  </button>
                </div>
              </div>
            </div>
          </div>

          {statsLoading ? (
            <div className="text-center py-12">
              <div className="text-white text-lg">Carregando estatísticas...</div>
            </div>
          ) : (
            <>
              {/* Cards de Estatísticas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total de Leads"
                  value={stats?.totalLeads || 0}
                  icon={<Users className="w-5 h-5 text-white" />}
                  color="bg-blue-500"
                  subtitle="Todos os seus leads"
                />
                <StatCard
                  title="Leads Ativos"
                  value={stats?.activeLeads || 0}
                  icon={<TrendingUp className="w-5 h-5 text-white" />}
                  color="bg-green-500"
                  subtitle="Em andamento"
                />
                <StatCard
                  title="Leads Urgentes"
                  value={stats?.urgentLeads || 0}
                  icon={<AlertTriangle className="w-5 h-5 text-white" />}
                  color="bg-yellow-500"
                  subtitle="Prioridade alta"
                />
                <StatCard
                  title="Finalizados"
                  value={stats?.closedLeads || 0}
                  icon={<CheckCircle className="w-5 h-5 text-white" />}
                  color="bg-purple-500"
                  subtitle="Convertidos/Fechados"
                />
              </div>

              {/* Cards de Estatísticas Secundárias */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="Novos esta Semana"
                  value={stats?.newLeadsThisWeek || 0}
                  icon={<Clock className="w-5 h-5 text-white" />}
                  color="bg-indigo-500"
                />
                <StatCard
                  title="Novos este Mês"
                  value={stats?.newLeadsThisMonth || 0}
                  icon={<BarChart3 className="w-5 h-5 text-white" />}
                  color="bg-cyan-500"
                />
                <StatCard
                  title="Leads Perdidos"
                  value={stats?.lostLeads || 0}
                  icon={<XCircle className="w-5 h-5 text-white" />}
                  color="bg-red-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Leads por Coluna do Kanban */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Leads por Etapa</h3>
                  <div className="space-y-3">
                    {stats?.columnStats?.map((column) => (
                      <div key={column.columnId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: column.columnColor }}
                          ></div>
                          <span className="text-gray-300">{column.columnTitle}</span>
                        </div>
                        <span className="text-white font-semibold">{column.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leads Urgentes */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Leads Urgentes</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stats?.urgentLeadsList?.length ? (
                      stats.urgentLeadsList.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                          <div>
                            <div className="text-white font-medium">{lead.name}</div>
                            <div className="text-gray-400 text-sm">{lead.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-yellow-400 text-sm font-medium">{lead.status}</div>
                            <div className="text-gray-500 text-xs">
                              {new Date(lead.updatedAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-center py-4">
                        Nenhum lead urgente no momento
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Atividade Recente */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  {stats?.recentActivity?.length ? (
                    stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                          <div>
                            <span className="text-white">{activity.name}</span>
                            <span className="text-gray-400 ml-2">• {activity.status}</span>
                          </div>
                        </div>
                        <div className="text-gray-500 text-sm">
                          {new Date(activity.updatedAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-center py-4">
                      Nenhuma atividade recente
                    </div>
                  )}
                </div>
              </div>


            </>
          )}
        </div>
      </main>
    </div>
  );
}