'use client';

import { useState, useEffect } from 'react';
import AddAttendantModal from '../../components/AddAttendantModal';
import EditAttendantModal from '../../components/EditAttendantModal';
import HelpModal from '../../components/HelpModal';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';
import { getHelpData } from '../../data/helpData';
// Removidas importações de componentes UI não existentes

interface Attendant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  photoUrl?: string;
  position?: { id: string; name: string } | null;
  function?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  positionId?: string;
  functionId?: string;
  departmentId?: string;
  startTime: string;
  endTime: string;
  workDays: string;
  isActive: boolean;
  status: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  leads: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  ratings: Array<{
    score: number;
    type: string;
    comment?: string;
  }>;
  stats: {
    totalLeads: number;
    avgScore: number;
    totalRatings: number;
    elogios: number;
    criticas: number;
    avaliacoes: number;
  };
}

export default function AttendantsPage() {
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAttendant, setSelectedAttendant] = useState<Attendant | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attendantToDelete, setAttendantToDelete] = useState<{id: string, name: string} | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const { isAdmin, userId, isLoading, userType } = useAuth();
  
  const helpData = getHelpData('attendants');

  const fetchAttendants = async () => {
    try {
      setDataLoading(true);
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      // Se não for admin, filtrar apenas atendentes do gerente logado
      const url = isAdmin ? '/api/attendants' : `/api/attendants?managerId=${userId}`;
      const data = await authenticatedFetch(url);
      setAttendants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && userId) {
      fetchAttendants();
    }
  }, [isLoading, userId, isAdmin]);

  // Verificar autenticação
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDirectAccess = async (attendantId: string, attendantName: string) => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      const response = await authenticatedFetch('/api/attendant/direct-access', {
        method: 'POST',
        body: { attendantId }
      });
      
      if (response.token) {
        // Salvar o token no cookie
        document.cookie = `attendant-token=${response.token}; path=/; max-age=86400`; // 24 horas
        
        // Redirecionar para o dashboard do atendente
        window.open('/attendant/dashboard', '_blank');
        
        console.log('✅ Acesso direto ao atendente:', attendantName);
      }
    } catch (error) {
      console.error('❌ Erro ao acessar conta do atendente:', error);
      alert('Erro ao acessar conta do atendente. Tente novamente.');
    }
  };

  const formatWorkDays = (workDays: string | string[]) => {
    const dayMap: { [key: string]: string } = {
      '1': 'Seg', 'monday': 'Seg',
      '2': 'Ter', 'tuesday': 'Ter',
      '3': 'Qua', 'wednesday': 'Qua',
      '4': 'Qui', 'thursday': 'Qui',
      '5': 'Sex', 'friday': 'Sex',
      '6': 'Sáb', 'saturday': 'Sáb',
      '0': 'Dom', '7': 'Dom', 'sunday': 'Dom'
    };
    
    // Se workDays for uma string, converte para array
    const daysArray = typeof workDays === 'string' 
      ? workDays.split(',').map(day => day.trim())
      : workDays || [];
    
    return daysArray.map(day => dayMap[day] || day).join(', ');
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-400';
    if (score >= 3.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleEditAttendant = (attendant: Attendant) => {
    setSelectedAttendant(attendant);
    setShowEditModal(true);
  };

  const handleDeleteAttendant = (id: string, name: string) => {
    setAttendantToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleAddAttendant = () => {
    setShowAddModal(true);
  };

  const confirmDelete = async () => {
    if (!attendantToDelete) return;
    
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      await authenticatedFetch(`/api/attendants/${attendantToDelete.id}`, {
        method: 'DELETE'
      });
      
      setAttendants(prev => prev.filter(a => a.id !== attendantToDelete.id));
      setShowDeleteModal(false);
      setAttendantToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir atendente:', error);
    }
  };

  const refreshAttendants = () => {
    fetchAttendants();
  };

  if (dataLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-white">Carregando atendentes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">Erro: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Atendentes" />
      
      <div className="flex justify-between items-center mb-6 mt-6">
        <div>
          <p className="text-gray-300 mt-2">
            Gerencie sua equipe de atendimento e acompanhe o desempenho
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHelpModal(true)}
            className="px-4 py-2 rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            title="Como usar este módulo"
          >
            <span>❓</span>
            Ajuda
          </button>
          {(isAdmin || userType === 'MANAGER') && (
            <button 
              onClick={handleAddAttendant}
              className="px-4 py-2 rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              Adicionar Atendente
            </button>
          )}
        </div>
      </div>

      {attendants.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4 text-4xl">👥</div>
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum atendente encontrado
              </h3>
              <p className="text-gray-300">
                Adicione atendentes para começar a gerenciar sua equipe.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendants.map((attendant) => (
            <div key={attendant.id} className="bg-gray-800 rounded-lg border border-gray-700 shadow-sm hover:shadow-lg transition-shadow">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center">
                      {attendant.photoUrl ? (
                        <img 
                          src={attendant.photoUrl} 
                          alt={attendant.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-12 w-12 bg-blue-900 text-blue-300 rounded-full flex items-center justify-center font-medium ${attendant.photoUrl ? 'hidden' : ''}`}>
                        {getInitials(attendant.name)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{attendant.name}</h3>
                      <p className="text-sm text-gray-300">{attendant.position?.name || 'Cargo não definido'}</p>
                      {attendant.department && (
                        <p className="text-xs text-gray-400">{attendant.department.name}</p>
                      )}
                      {attendant.manager && (
                        <p className="text-xs text-blue-400">👤 Gerente: {attendant.manager.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      attendant.isActive 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {attendant.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {(isAdmin || (userType === 'MANAGER' && attendant.manager?.id === userId)) && (
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleDirectAccess(attendant.id, attendant.name)}
                          className="p-1.5 rounded-md transition-colors text-gray-400 hover:text-green-400 hover:bg-gray-700"
                          title="Acessar conta do atendente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </button>
                        {(isAdmin || (userType === 'MANAGER' && attendant.manager?.id === userId)) && (
                          <>
                            <button 
                              onClick={() => handleEditAttendant(attendant)}
                              className="p-1.5 rounded-md transition-colors text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                              title="Editar atendente"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={() => handleDeleteAttendant(attendant.id, attendant.name)}
                                className="p-1.5 rounded-md transition-colors text-gray-400 hover:text-red-400 hover:bg-gray-700"
                                title="Excluir atendente"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-6 space-y-4">
                {/* Informações de Contato */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="mr-2">📧</span>
                    {attendant.email}
                  </div>
                  {attendant.phone && (
                    <div className="flex items-center text-sm text-gray-300">
                      <span className="mr-2">📞</span>
                      {attendant.phone}
                    </div>
                  )}
                </div>

                {/* Horário de Trabalho */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="mr-2">🕐</span>
                    {attendant.startTime} - {attendant.endTime}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatWorkDays(attendant.workDays)}
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {attendant.stats?.totalLeads || 0}
                    </div>
                    <div className="text-xs text-gray-400">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold flex items-center justify-center ${getScoreColor(attendant.stats?.avgScore || 0)}`}>
                      <span className="mr-1">⭐</span>
                      {(attendant.stats?.avgScore || 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {attendant.stats?.totalRatings || 0} avaliações
                    </div>
                  </div>
                </div>

                {/* Avaliações por Tipo */}
                {(attendant.stats?.totalRatings || 0) > 0 && (
                  <div className="flex justify-between text-xs pt-2 border-t border-gray-700">
                    <span className="text-green-400">
                      {attendant.stats?.elogios || 0} elogios
                    </span>
                    <span className="text-yellow-400">
                      {attendant.stats?.avaliacoes || 0} avaliações
                    </span>
                    <span className="text-red-400">
                      {attendant.stats?.criticas || 0} críticas
                    </span>
                  </div>
                )}

                {/* Lista de Leads */}
                {attendant.leads && attendant.leads.length > 0 && (
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Leads Ativos</h4>
                      <span className="text-xs text-gray-400">{attendant.leads.length} total</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {attendant.leads.slice(0, 5).map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300 truncate">{lead.name}</span>
                          <span className={`px-2 py-1 rounded-full ${
                            lead.status === 'novo' ? 'bg-blue-900 text-blue-300' :
                            lead.status === 'contato' ? 'bg-yellow-900 text-yellow-300' :
                            lead.status === 'proposta' ? 'bg-purple-900 text-purple-300' :
                            lead.status === 'fechado' ? 'bg-green-900 text-green-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                      ))}
                      {attendant.leads.length > 5 && (
                        <div className="text-xs text-gray-400 text-center pt-1">
                          +{attendant.leads.length - 5} mais leads
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar Atendente */}
      {showAddModal && (
        <AddAttendantModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshAttendants}
        />
      )}

      {/* Modal de Editar Atendente */}
      {showEditModal && selectedAttendant && (
        <EditAttendantModal 
          attendant={selectedAttendant}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAttendant(null);
          }}
          onSuccess={refreshAttendants}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && attendantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja excluir o atendente <strong>{attendantToDelete.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAttendantToDelete(null);
                }}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Ajuda */}
      {showHelpModal && helpData && (
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          moduleName={helpData.moduleName}
          steps={helpData.steps}
        />
      )}
    </div>
  );
}