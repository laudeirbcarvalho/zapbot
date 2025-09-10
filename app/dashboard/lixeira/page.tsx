'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';

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

      </div>
    </div>
  );
}