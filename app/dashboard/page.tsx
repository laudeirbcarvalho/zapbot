"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Users, TrendingUp, Clock, CheckCircle, AlertTriangle, XCircle, BarChart3, UserCheck } from "lucide-react";
import Header from "../components/Header";

interface DashboardStats {
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
  attendantStats: any[];
  userType: string;
  userName: string;
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

export default function Dashboard() {
  const router = useRouter();
  const { isAdmin, userId, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há parâmetros de login automático na URL
    const urlParams = new URLSearchParams(window.location.search);
    const autoLoginToken = urlParams.get('autoLogin');
    const adminName = urlParams.get('adminName');
    const newSession = urlParams.get('newSession');
    
    if (autoLoginToken) {
      console.log('🔑 Login automático detectado para:', adminName);
      console.log('🆕 Nova sessão:', newSession === 'true' ? 'Sim' : 'Não');
      
      try {
        // Decodificar o JWT para obter os dados do usuário
        const tokenPayload = JSON.parse(atob(autoLoginToken.split('.')[1]));
        console.log('📋 Dados do token:', tokenPayload);
        
        // Escolher storage baseado no parâmetro newSession
        const storage = newSession === 'true' ? sessionStorage : localStorage;
        
        // Salvar token no storage apropriado
        storage.setItem('authToken', autoLoginToken);
        
        // Salvar dados do usuário no storage apropriado
        const userData = {
          id: tokenPayload.userId,
          name: tokenPayload.name || adminName,
          email: tokenPayload.email,
          userType: 'ADMIN',
          isSuperAdmin: tokenPayload.isSuperAdmin || false,
          tenantId: tokenPayload.tenantId
        };
        storage.setItem('user', JSON.stringify(userData));
        
        console.log('💾 Dados do usuário salvos:', userData);
        
        // Disparar evento customizado para notificar componentes sobre a mudança
        window.dispatchEvent(new Event('userUpdated'));
        
        // Limpar parâmetros da URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Mostrar mensagem de sucesso
        console.log('✅ Login automático realizado com sucesso!');
        
        // Recarregar a página para aplicar o novo token
        window.location.reload();
        return;
      } catch (error) {
        console.error('❌ Erro ao processar token de login automático:', error);
      }
    }
    
    if (!isLoading && userId) {
       fetchStats();
     }
   }, [isLoading, userId]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Header title={`Dashboard ${stats?.userType === 'ADMIN' ? 'Administrativo' : 'Gerencial'}`} />
      
      {statsLoading ? (
        <div className="text-center py-12">
          <div className="text-white text-lg">Carregando estatísticas...</div>
        </div>
      ) : (
        <>
          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <StatCard
              title="Total de Leads"
              value={stats?.totalLeads || 0}
              icon={<Users className="w-5 h-5 text-white" />}
              color="bg-blue-500"
              subtitle={stats?.userType === 'ADMIN' ? 'Sistema completo' : 'Sua equipe'}
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
              subtitle="Requer atenção"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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

            {/* Atividade Recente */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
              <div className="space-y-3">
                {stats?.recentActivity?.length ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{activity.name}</div>
                        <div className="text-gray-400 text-sm">
                          {activity.attendant?.name || 'Sem atendente'} • {activity.status}
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(activity.updatedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">Nenhuma atividade recente</div>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas de Atendentes (apenas para Admin e Manager) */}
          {stats?.attendantStats?.length > 0 && (
            <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                {stats.userType === 'ADMIN' ? 'Top Atendentes' : 'Minha Equipe'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.attendantStats.map((attendant) => (
                  <div key={attendant.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <UserCheck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{attendant.name}</div>
                        <div className="text-gray-400 text-sm">{attendant.attendancesCount || 0} atendimentos</div>
                        <div className="text-gray-500 text-xs">{attendant._count.leads} leads atribuídos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}