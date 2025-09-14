"use client";

import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import HelpModal from "@/app/components/HelpModal";
import { useState, useEffect } from "react";
import { useColumnSync } from "@/app/hooks/useColumnSync";
import { useAuth } from "@/app/hooks/useAuth";
import { getHelpData } from "@/app/data/helpData";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  columnId: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  attendantId?: string;
  attendant?: {
    id: string;
    name: string;
    email: string;
    position: string;
    department?: string;
    isActive: boolean;
  };
}

interface Column {
  id: string;
  title: string;
  position: number;
  color?: string;
}

interface Attendant {
  id: string;
  name: string;
  email: string;
  position: string;
  department?: string;
  isActive: boolean;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToColumnChanges, getCurrentColumns } = useColumnSync();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicatesData, setDuplicatesData] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showImportProgressModal, setShowImportProgressModal] = useState(false);
  const [importProgressData, setImportProgressData] = useState<any>(null);
  
  // Estados para seleção em massa
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const helpData = getHelpData('leads');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Site',
    status: 'novo',
    notes: '',
    attendantId: ''
  });
  
  // Atualizar status padrão quando colunas carregarem
  useEffect(() => {
    if (columns.length > 0 && (formData.status === 'novo' || formData.status === '')) {
      // Buscar a coluna 'Chegada' ou usar a primeira coluna
      const chegadaColumn = columns.find(col => col.title.toLowerCase().includes('chegada')) || columns[0];
      setFormData(prev => ({
        ...prev,
        status: 'chegada' // Status deve ser 'chegada', não o ID da coluna
      }));
    }
  }, [columns, formData.status]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const data = await authenticatedFetch('/api/leads');
      setLeads(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar leads. Tente novamente.');
      console.error('Erro ao buscar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendants = async () => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const data = await authenticatedFetch('/api/attendants');
      setAttendants(data.filter((attendant: Attendant) => attendant.isActive));
    } catch (err) {
      console.error('Erro ao buscar atendentes:', err);
    }
  };

  const fetchColumns = async () => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const data = await authenticatedFetch('/api/columns');
      setColumns(data.sort((a: Column, b: Column) => a.position - b.position));
    } catch (err) {
      console.error('Erro ao buscar colunas:', err);
      
      // Verificar se é erro de permissão
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        // Usar colunas padrão se não tiver permissão
        setColumns([
          { id: 'novo', title: 'Novo', position: 0, color: '#3B82F6' },
          { id: 'contato', title: 'Contato', position: 1, color: '#F59E0B' },
          { id: 'proposta', title: 'Proposta', position: 2, color: '#8B5CF6' },
          { id: 'fechado', title: 'Fechado', position: 3, color: '#10B981' }
        ]);
      }
    }
  };

  // Verificar autenticação usando localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Buscar leads, colunas e atendentes da API
  useEffect(() => {
    fetchLeads();
    fetchColumns();
    fetchAttendants();
  }, []);

  // Sincronização automática com mudanças de colunas do Kanban
  useEffect(() => {
    // Verificar se já temos colunas do gerenciador global
    const currentColumns = getCurrentColumns();
    if (currentColumns.length > 0) {
      setColumns(currentColumns);
    }

    // Inscrever-se para mudanças futuras
    const unsubscribe = subscribeToColumnChanges((updatedColumns) => {
      console.log('📋 Formulário de leads: Colunas atualizadas automaticamente:', updatedColumns);
      setColumns(updatedColumns);
      
      // Se o status atual do formulário não existe mais nas colunas, resetar para a primeira coluna
      if (updatedColumns.length > 0 && !updatedColumns.find(col => col.id === formData.status)) {
        setFormData(prev => ({
          ...prev,
          status: updatedColumns[0].id
        }));
      }
    });

    return unsubscribe;
  }, [subscribeToColumnChanges, getCurrentColumns, formData.status]);
  
  // Verificar autenticação
  const { isAdmin, userId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-6">
        <Header title="Leads" />
        <div className="mt-6 text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6">
        <Header title="Leads" />
        <div className="mt-6 text-center">
          <div className="bg-red-900 text-red-200 p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p>Você precisa estar logado para acessar esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  // Adicionar novo lead
  const handleAddLead = async () => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      // Buscar a coluna 'Chegada' para definir o columnId
      const chegadaColumn = columns.find(col => col.title.toLowerCase().includes('chegada')) || columns[0];
      
      const leadData = {
        ...formData,
        columnId: chegadaColumn?.id || null, // Definir columnId corretamente
        status: 'chegada' // Status deve ser 'chegada'
      };
      
      await authenticatedFetch('/api/leads', {
        method: 'POST',
        body: leadData,
      });

      await fetchLeads();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao adicionar lead:', err);
      setError('Erro ao adicionar lead. Tente novamente.');
    }
  };

  // Atualizar lead existente
  const handleUpdateLead = async () => {
    if (!currentLead) return;
    
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      await authenticatedFetch(`/api/leads/${currentLead.id}`, {
        method: 'PUT',
        body: {
          ...formData,
          position: currentLead.position,
          columnId: currentLead.columnId
        },
      });

      await fetchLeads();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
      setError('Erro ao atualizar lead. Tente novamente.');
    }
  };

  // Mover lead para lixeira (soft delete)
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja mover este lead para a lixeira?')) return;
    
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      await authenticatedFetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });

      await fetchLeads();
    } catch (err) {
      console.error('Erro ao mover lead para lixeira:', err);
      setError('Erro ao mover lead para lixeira. Tente novamente.');
    }
  };

  // Exclusão em massa de leads
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      alert('Nenhum lead selecionado');
      return;
    }

    const confirmMessage = `Tem certeza que deseja mover ${selectedLeads.length} lead(s) selecionado(s) para a lixeira?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Processar exclusões em lotes
      for (const leadId of selectedLeads) {
        try {
          const { authenticatedFetch } = await import('@/app/lib/api-client');
          await authenticatedFetch(`/api/leads/${leadId}`, {
            method: 'DELETE',
          });
          successCount++;
        } catch (err) {
          console.error(`Erro ao excluir lead ${leadId}:`, err);
          errorCount++;
        }
      }

      // Limpar seleções
      setSelectedLeads([]);
      setSelectAll(false);
      
      // Recarregar dados
      await fetchLeads();
      
      // Mostrar resultado
      if (errorCount === 0) {
        alert(`${successCount} lead(s) movido(s) para a lixeira com sucesso!`);
      } else {
        alert(`${successCount} lead(s) movido(s) com sucesso. ${errorCount} erro(s) ocorreram.`);
      }
    } catch (err) {
      console.error('Erro na exclusão em massa:', err);
      setError('Erro ao mover leads para a lixeira. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para adicionar lead
  const openAddModal = () => {
    setModalMode('add');
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar lead
  const openEditModal = (lead: Lead) => {
    setModalMode('edit');
    setCurrentLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'Site',
      status: lead.status,
      notes: lead.notes || '',
      attendantId: lead.attendantId || ''
    });
    setShowModal(true);
  };

  // Resetar formulário
  const resetForm = () => {
    // Buscar a coluna 'Chegada' ou usar a primeira coluna
    const chegadaColumn = columns.find(col => col.title.toLowerCase().includes('chegada')) || columns[0];
    const defaultStatus = chegadaColumn ? chegadaColumn.id : 'novo';
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: 'Site',
      status: defaultStatus,
      notes: '',
      attendantId: ''
    });
    setCurrentLead(null);
  };

  // Manipular mudanças no formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manipular envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      handleAddLead();
    } else {
      handleUpdateLead();
    }
  };

  // Manipular importação de Excel
  const handleImportExcel = async () => {
    if (!importFile) {
      alert('Por favor, selecione um arquivo Excel para importar.');
      return;
    }

    try {
      setImportLoading(true);
      console.log('🚀 Iniciando importação do arquivo:', importFile.name);
      
      // Fechar modal de upload e abrir modal de progresso
      setShowImportModal(false);
      setShowImportProgressModal(true);
      setImportProgressData({
        fileName: importFile.name,
        status: 'processing',
        message: 'Processando arquivo...'
      });
      
      const formData = new FormData();
      formData.append('file', importFile);

      const { authenticatedFetch } = await import('@/app/lib/api-client');
      console.log('📤 Enviando requisição para API de importação...');
      
      const result = await authenticatedFetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });
      console.log('✅ Resultado da importação:', result);
      
      // Verificar se requer confirmação para duplicatas
      if (result.requiresConfirmation) {
        setDuplicatesData(result);
        setShowDuplicatesModal(true);
        setShowImportProgressModal(false);
        setImportLoading(false);
        return;
      }
      
      // Atualizar modal de progresso com resultado da importação
      const { imported = 0, skipped = 0, total = 0 } = result;
      setImportProgressData({
        fileName: importFile.name,
        status: 'completed',
        message: 'Importação concluída com sucesso!',
        results: {
          total,
          imported,
          skipped
        }
      });
      
      // Recarregar a lista de leads
      console.log('🔄 Recarregando lista de leads...');
      await fetchLeads();
      
      // Limpar arquivo
      setImportFile(null);
      
      console.log('✅ Importação finalizada com sucesso!');
      
    } catch (error) {
      console.error('💥 Erro na importação:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Atualizar modal de progresso com erro
      setImportProgressData({
        fileName: importFile.name,
        status: 'error',
        message: 'Falha na importação',
        error: errorMessage,
        tips: [
          'Verifique se o arquivo Excel está no formato correto',
          'Certifique-se de que as colunas estão na ordem: Nome, Email, Telefone, Origem',
          'Tente novamente ou contate o suporte'
        ]
      });
        
    } finally {
      setImportLoading(false);
      console.log('🏁 Processo de importação finalizado.');
    }
  };

  // Confirmar importação de duplicatas
  const handleConfirmImport = async () => {
    if (!importFile) return;

    try {
      setImportLoading(true);
      console.log('🚀 Confirmando importação forçada...');
      
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('forceImport', 'true');

      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      const result = await authenticatedFetch('/api/leads/import/confirm', {
        method: 'POST',
        body: formData,
      });
      
      // Mostrar resultado da importação
      const { imported = 0, skipped = 0, total = 0 } = result;
      const successMessage = `Importação forçada concluída!\n\n` +
        `📊 Resumo:\n` +
        `• Total de registros processados: ${total}\n` +
        `• Leads importados: ${imported}\n` +
        `• Leads ignorados: ${skipped}`;
      
      alert(successMessage);
      
      // Recarregar a lista de leads
      await fetchLeads();
      
      // Fechar modais e limpar arquivo
      setShowDuplicatesModal(false);
      setShowImportModal(false);
      setImportFile(null);
      setDuplicatesData(null);
      
    } catch (error) {
      console.error('💥 Erro na importação forçada:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Falha na Importação Forçada\n\n${errorMessage}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Cancelar importação de duplicatas
  const handleCancelImport = () => {
    setShowDuplicatesModal(false);
    setDuplicatesData(null);
    setImportLoading(false);
  };

  // Fechar modal de progresso da importação
  const handleCloseImportProgress = () => {
    setShowImportProgressModal(false);
    setImportProgressData(null);
  };



  // Redireciona para login se não estiver autenticado
  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <Header title="Leads" />
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lista de Leads</h2>
          <div className="flex gap-2 items-center">
             <button 
               onClick={() => setShowHelpModal(true)}
               className="px-4 py-2 rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
               title="Como usar este módulo"
             >
               <span>❓</span>
               Ajuda
             </button>
             <button 
               onClick={() => setShowImportModal(true)}
               className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700"
             >
               Importar Excel
             </button>

             <button 
               onClick={openAddModal}
               className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
             >
               Adicionar Lead
             </button>
           </div>
        </div>
        
        {/* Filtro por origem */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Filtrar por origem:</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="p-2 bg-gray-700 border border-gray-600 rounded-md"
          >
            <option value="all">Todas as origens</option>
            <option value="Site">Site</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="Indicação">Indicação</option>
          </select>
        </div>
        
        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Ações em massa */}
        {leads.filter(lead => sourceFilter === 'all' || lead.source === sourceFilter).length > 0 && (
          <div className="mb-4 flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectAll(checked);
                  const filteredLeads = leads.filter(lead => sourceFilter === 'all' || lead.source === sourceFilter);
                  if (checked) {
                    setSelectedLeads(filteredLeads.map(lead => lead.id));
                  } else {
                    setSelectedLeads([]);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              Selecionar Tudo ({leads.filter(lead => sourceFilter === 'all' || lead.source === sourceFilter).length} leads)
            </label>
            {selectedLeads.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center gap-2"
                title={`Mover ${selectedLeads.length} lead(s) selecionado(s) para a lixeira`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    🗑️ Mover Selecionados para Lixeira ({selectedLeads.length})
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2">Carregando leads...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectAll(checked);
                        const filteredLeads = leads.filter(lead => sourceFilter === 'all' || lead.source === sourceFilter);
                        if (checked) {
                          setSelectedLeads(filteredLeads.map(lead => lead.id));
                        } else {
                          setSelectedLeads([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Origem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data Cadastro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Atendente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leads.filter(lead => sourceFilter === 'all' || lead.source === sourceFilter).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-400">
                      Nenhum lead encontrado. Adicione um novo lead.
                    </td>
                  </tr>
                ) : (
                  leads.filter(lead => sourceFilter === 'all' || lead.source === sourceFilter).map((lead) => {
                    const column = columns.find(col => col.id === lead.columnId);
                    const backgroundColor = column?.color ? `${column.color}20` : 'transparent';
                    const borderColor = column?.color || 'transparent';
                    
                    return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gray-700" 
                      style={{ 
                        backgroundColor, 
                        borderLeft: `4px solid ${borderColor}` 
                      }}
                    >
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
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {lead.attendant ? lead.attendant.name : 'Não atribuído'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        <span 
                          className="px-2 py-1 rounded-full text-xs text-white"
                          style={{ backgroundColor: column?.color || '#6B7280' }}
                        >
                          {column?.title || 'Sem status'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        <button 
                          onClick={() => openEditModal(lead)}
                          className="mr-2 text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para confirmar importação de duplicatas */}
      {showDuplicatesModal && duplicatesData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-red-400">⚠️ Leads Duplicados Encontrados</h3>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                Foram encontrados <strong className="text-white">{duplicatesData.duplicates?.length || 0} leads duplicados</strong> que podem ser importados 
                porque pertencem a uma hierarquia diferente.
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Deseja prosseguir com a importação mesmo assim?
              </p>
            </div>

            {/* Lista de duplicatas */}
            <div className="mb-6">
              <h4 className="font-medium mb-2 text-white">Leads que serão duplicados:</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-600 rounded p-2 bg-gray-700">
                {duplicatesData.duplicates?.map((duplicate: any, index: number) => (
                  <div key={index} className="py-1 px-2 border-b border-gray-600 last:border-b-0 text-sm">
                    <span className="font-medium text-white">{duplicate.name}</span>
                    {duplicate.phone !== 'Sem telefone' && (
                      <span className="text-gray-300 ml-2">📱 {duplicate.phone}</span>
                    )}
                    {duplicate.email !== 'Sem email' && (
                      <span className="text-gray-300 ml-2">✉️ {duplicate.email}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo atual */}
            <div className="mb-6 p-3 bg-gray-700 border border-gray-600 rounded">
              <h4 className="font-medium mb-2 text-blue-400">📊 Resumo da Importação:</h4>
              <div className="text-sm text-gray-300">
                <p>• Total de registros: <span className="text-white">{duplicatesData.total}</span></p>
                <p>• Já importados: <span className="text-green-400">{duplicatesData.imported}</span></p>
                <p>• Ignorados (mesma hierarquia): <span className="text-yellow-400">{duplicatesData.skipped}</span></p>
                <p>• Duplicatas que podem ser importadas: <span className="text-orange-400">{duplicatesData.duplicates?.length || 0}</span></p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelImport}
                disabled={importLoading}
                className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center transition-colors"
              >
                {importLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importando...
                  </>
                ) : (
                  'Sim, Importar Mesmo Assim'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para adicionar/editar lead */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {modalMode === 'add' ? 'Adicionar Novo Lead' : 'Editar Lead'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nome*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Origem</label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleFormChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                >
                  <option value="Site">Site</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Indicação">Indicação</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Atendente</label>
                <select
                  name="attendantId"
                  value={formData.attendantId}
                  onChange={handleFormChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                >
                  <option value="">Sem atendente</option>
                  {attendants.map((attendant) => (
                    <option key={attendant.id} value={attendant.id}>
                      {attendant.name} - {typeof attendant.position === 'string' ? attendant.position : attendant.position?.name || 'Sem cargo'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {modalMode === 'add' ? 'Adicionar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para importar Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Importar Leads do Excel</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Selecione o arquivo Excel (.xlsx, .xls)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
            
            <div className="mb-4 p-3 bg-gray-700 rounded-md">
              <p className="text-sm text-gray-300 mb-2">Formato esperado do Excel:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Coluna A: Nome (obrigatório)</li>
                <li>• Coluna B: Email (obrigatório)</li>
                <li>• Coluna C: Telefone (obrigatório)</li>
                <li>• Coluna D: Origem</li>
              </ul>

            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportExcel}
                disabled={!importFile || importLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md"
              >
                {importLoading ? 'Importando...' : 'Importar'}
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

      {/* Modal de Progresso da Importação */}
      {showImportProgressModal && importProgressData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {importProgressData.status === 'processing' && '⏳ Importando Leads'}
                {importProgressData.status === 'completed' && '✅ Importação Concluída'}
                {importProgressData.status === 'error' && '❌ Erro na Importação'}
              </h3>
              {importProgressData.status !== 'processing' && (
                <button
                  onClick={handleCloseImportProgress}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                Arquivo: <span className="text-white">{importProgressData.fileName}</span>
              </p>
              
              {importProgressData.status === 'processing' && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-blue-400">{importProgressData.message}</span>
                </div>
              )}
              
              {importProgressData.status === 'completed' && (
                <div>
                  <p className="text-green-400 mb-3">{importProgressData.message}</p>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <h4 className="font-medium mb-2 text-blue-400">📊 Resumo da Importação:</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>• Total de registros processados: <span className="text-white">{importProgressData.results.total}</span></p>
                      <p>• Leads importados: <span className="text-green-400">{importProgressData.results.imported}</span></p>
                      <p>• Leads ignorados (duplicados): <span className="text-yellow-400">{importProgressData.results.skipped}</span></p>
                    </div>
                  </div>
                </div>
              )}
              
              {importProgressData.status === 'error' && (
                <div>
                  <p className="text-red-400 mb-2">{importProgressData.message}</p>
                  <p className="text-sm text-gray-300 mb-3">Erro: {importProgressData.error}</p>
                  <div className="bg-gray-700 p-3 rounded-md">
                    <h4 className="font-medium mb-2 text-yellow-400">💡 Dicas:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {importProgressData.tips.map((tip: string, index: number) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            {importProgressData.status !== 'processing' && (
              <div className="flex justify-end">
                <button
                  onClick={handleCloseImportProgress}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}