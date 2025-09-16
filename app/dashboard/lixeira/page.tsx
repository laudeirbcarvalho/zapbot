'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import HelpModal from '@/app/components/HelpModal';
import { getHelpData } from '@/app/data/helpData';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  notes?: string;
  deletedAt: string;
  deletedBy?: string;
  attendant?: {
    id: string;
    name: string;
    email: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  column?: {
    id: string;
    title: string;
  };
  // Campos para Pessoa Física
  cpf?: string;
  nomeCompleto?: string;
  // Campos para Pessoa Jurídica
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  // Campos de Endereço
  tipoEndereco?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  nomeCidadeExterior?: string;
  codigoPais?: string;
  // Campos de Contato
  telefones?: string;
  emails?: string;
  websites?: string;
  // Campos Empresariais
  dataInicioAtividade?: string;
  situacaoCadastral?: string;
  ultimaAtualizacao?: string;
  matrizFilial?: string;
  capitalSocial?: number;
  faixaFaturamento?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function LixeiraPage() {
  const { isAdmin, userId, isLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const helpData = getHelpData('lixeira');

  const fetchTrashLeads = async () => {
    try {
      setDataLoading(true);
      
      // Aguardar o carregamento da autenticação
      if (isLoading) {
        return;
      }
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token de autenticação não encontrado');
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/leads/trash?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Erro ao carregar leads da lixeira');
      }

      const data = await response.json();
      setLeads(data.leads);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && userId) {
      fetchTrashLeads();
    }
  }, [pagination.page, searchTerm, isLoading, userId]);

  const handleRestore = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja restaurar este lead?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/leads/trash/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadId })
      });
      
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao restaurar lead');
      }

      await fetchTrashLeads();
      alert('Lead restaurado com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao restaurar lead');
    }
  };

  const handlePermanentDelete = async (leadId: string) => {
    if (!confirm('ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja excluir definitivamente este lead?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/leads/trash?id=${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        alert('Apenas administradores podem excluir definitivamente');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir lead definitivamente');
      }

      await fetchTrashLeads();
      alert('Lead excluído definitivamente!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir lead definitivamente');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      alert('Nenhum lead selecionado');
      return;
    }

    const confirmMessage = `ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja excluir definitivamente ${selectedLeads.length} lead(s) selecionado(s)?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      setDataLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Processar exclusões em lotes para evitar sobrecarga
      for (const leadId of selectedLeads) {
        try {
          const response = await fetch(`/api/leads/trash?id=${leadId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            router.push('/login');
            return;
          }

          if (response.status === 403) {
            alert('Apenas administradores podem excluir definitivamente');
            return;
          }

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      // Limpar seleções
      setSelectedLeads([]);
      setSelectAll(false);
      
      // Recarregar dados
      await fetchTrashLeads();
      
      // Mostrar resultado
      if (errorCount === 0) {
        alert(`${successCount} lead(s) excluído(s) definitivamente com sucesso!`);
      } else {
        alert(`${successCount} lead(s) excluído(s) com sucesso. ${errorCount} erro(s) ocorreram.`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir leads em massa');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTrashLeads();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

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

  if (dataLoading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <Header title="Lixeira" />
        <div className="flex justify-center items-center h-64 mt-6">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <Header title="Lixeira" />
        <div className="bg-red-900 text-red-200 p-4 rounded-md mt-6">
          <strong>Erro:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <Header title="Lixeira" />
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Leads Excluídos</h2>
            <p className="text-gray-300 mt-1">Gerencie leads na lixeira - restaure ou exclua permanentemente</p>
          </div>
          <button 
            onClick={() => setShowHelpModal(true)}
            className="px-4 py-2 rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            title="Como usar este módulo"
          >
            <span>❓</span>
            Ajuda
          </button>
        </div>
        
        {/* Barra de pesquisa */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar leads na lixeira..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Pesquisar
            </button>
          </div>
        </form>

        {/* Ações em massa - apenas para admins */}
        {isAdmin && leads.length > 0 && (
          <div className="mb-4 flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectAll(checked);
                  if (checked) {
                    setSelectedLeads(leads.map(lead => lead.id));
                  } else {
                    setSelectedLeads([]);
                  }
                }}
                className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
              />
              Selecionar Tudo ({leads.length} leads)
            </label>
            {selectedLeads.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title={`Excluir definitivamente ${selectedLeads.length} lead(s) selecionado(s)`}
              >
                🗑️ Excluir Selecionados ({selectedLeads.length})
              </button>
            )}
          </div>
        )}

        {/* Lista de leads */}
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🗑️</div>
            <p className="text-gray-400">Nenhum lead na lixeira</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectAll(checked);
                            if (checked) {
                              setSelectedLeads(leads.map(lead => lead.id));
                            } else {
                              setSelectedLeads([]);
                            }
                          }}
                          className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Atendente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Quadro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Excluído em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-700">
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                setSelectedLeads(prev => [...prev, lead.id]);
                              } else {
                                setSelectedLeads(prev => prev.filter(id => id !== lead.id));
                                setSelectAll(false);
                              }
                            }}
                            className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{lead.name}</div>
                        {lead.source && (
                          <div className="text-sm text-gray-400">{lead.source}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {lead.email && <div>{lead.email}</div>}
                          {lead.phone && <div>{lead.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {lead.attendant ? lead.attendant.name : 'Sem atendente'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {lead.column ? lead.column.title : 'Sem quadro'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {formatDate(lead.deletedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestore(lead.id)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Restaurar lead"
                          >
                            ♻️ Restaurar
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handlePermanentDelete(lead.id)}
                              className="text-red-400 hover:text-red-300 transition-colors ml-4"
                              title="Excluir definitivamente (apenas admin)"
                            >
                              🗑️ Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-700 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} leads
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-gray-300">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
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
    </div>
  );
}