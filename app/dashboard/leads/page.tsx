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
        setImportLoading(false);
        return;
      }
      
      // Mostrar resultado da importação
      const { imported = 0, skipped = 0, total = 0 } = result;
      const successMessage = `Importação concluída com sucesso!\n\n` +
        `📊 Resumo:\n` +
        `• Total de registros processados: ${total}\n` +
        `• Leads importados: ${imported}\n` +
        `• Leads ignorados (duplicados): ${skipped}`;
      
      alert(successMessage);
      
      // Recarregar a lista de leads
      console.log('🔄 Recarregando lista de leads...');
      await fetchLeads();
      
      // Fechar modal e limpar arquivo
      setShowImportModal(false);
      setImportFile(null);
      
      console.log('✅ Importação finalizada com sucesso!');
      
    } catch (error) {
      console.error('💥 Erro na importação:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      alert(`❌ Falha na Importação\n\n` +
        `Erro: ${errorMessage}\n\n` +
        `💡 Dicas:\n` +
        `• Verifique se o arquivo Excel está no formato correto\n` +
        `• Certifique-se de que as colunas estão na ordem: Nome, Email, Telefone, Origem\n` +
        `• Tente novamente ou contate o suporte`);
        
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

  // Baixar planilha de exemplo
  const handleDownloadExample = () => {
    // Criar dados de exemplo
    const exampleData = [
      ['Nome', 'Email', 'Telefone', 'Origem'],
      ['João Silva', 'joao@email.com', '(11) 99999-9999', 'Site'],
      ['Maria Santos', 'maria@email.com', '(11) 88888-8888', 'WhatsApp'],
      ['Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 'Facebook']
    ];

    // Criar CSV
    const csvContent = exampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'exemplo-leads.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
             <a
               href="/api/leads/example"
               download="exemplo-leads.xlsx"
               className="px-3 py-2 text-sm rounded-md text-green-600 border border-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
             >
               📥 Baixar Exemplo
             </a>
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
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
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
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-red-600">⚠️ Leads Duplicados Encontrados</h3>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Foram encontrados <strong>{duplicatesData.duplicates?.length || 0} leads duplicados</strong> que podem ser importados 
                porque pertencem a uma hierarquia diferente.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Deseja prosseguir com a importação mesmo assim?
              </p>
            </div>

            {/* Lista de duplicatas */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Leads que serão duplicados:</h4>
              <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                {duplicatesData.duplicates?.map((duplicate: any, index: number) => (
                  <div key={index} className="py-1 px-2 border-b last:border-b-0 text-sm">
                    <span className="font-medium">{duplicate.name}</span>
                    {duplicate.phone !== 'Sem telefone' && (
                      <span className="text-gray-600 ml-2">📱 {duplicate.phone}</span>
                    )}
                    {duplicate.email !== 'Sem email' && (
                      <span className="text-gray-600 ml-2">✉️ {duplicate.email}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo atual */}
            <div className="mb-6 p-3 bg-blue-50 rounded">
              <h4 className="font-medium mb-2">📊 Resumo da Importação:</h4>
              <div className="text-sm text-gray-700">
                <p>• Total de registros: {duplicatesData.total}</p>
                <p>• Já importados: {duplicatesData.imported}</p>
                <p>• Ignorados (mesma hierarquia): {duplicatesData.skipped}</p>
                <p>• Duplicatas que podem ser importadas: {duplicatesData.duplicates?.length || 0}</p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelImport}
                disabled={importLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
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
              <button
                type="button"
                onClick={handleDownloadExample}
                className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-md text-white"
              >
                Baixar Planilha de Exemplo
              </button>
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
    </div>
  );
}