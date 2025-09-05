"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Header from "@/app/components/Header";
import { useState, useEffect } from "react";
import { useColumnSync } from "@/app/hooks/useColumnSync";
import { eventEmitter, EVENTS, useStorageEvents } from '@/lib/events';

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
}

interface Column {
  id: string;
  title: string;
  position: number;
}

export default function LeadsPage() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToColumnChanges, getCurrentColumns } = useColumnSync();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Site',
    status: 'novo',
    notes: ''
  });

  // Função para converter status em nome amigável
  const getStatusDisplayName = (status: string): string => {
    const column = columns.find(col => col.id === status);
    return column ? column.title : status;
  };

  // Atualizar status padrão quando colunas carregarem
  useEffect(() => {
    if (columns.length > 0 && formData.status === 'novo' && !columns.find(col => col.id === 'novo')) {
      setFormData(prev => ({
        ...prev,
        status: columns[0].id
      }));
    }
  }, [columns]);

  // Buscar leads e colunas da API
  useEffect(() => {
    if (status === "authenticated") {
      fetchLeads();
      fetchColumns();
    }
    
    // Configurar listener para eventos de storage
    const cleanup = useStorageEvents();
    return cleanup;
  }, [status]);

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

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error('Falha ao buscar leads');
      }
      const data = await response.json();
      setLeads(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar leads. Tente novamente.');
      console.error('Erro ao buscar leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColumns = async () => {
    try {
      const response = await fetch('/api/columns');
      if (!response.ok) {
        throw new Error('Falha ao buscar colunas');
      }
      const data = await response.json();
      setColumns(data.sort((a: Column, b: Column) => a.position - b.position));
    } catch (err) {
      console.error('Erro ao buscar colunas:', err);
      // Fallback para colunas padrão se a API falhar
      setColumns([
        { id: 'novo', title: 'Novo', position: 0 },
        { id: 'em-contato', title: 'Em contato', position: 1 },
        { id: 'qualificado', title: 'Qualificado', position: 2 },
        { id: 'negociacao', title: 'Negociação', position: 3 },
        { id: 'fechado', title: 'Fechado', position: 4 }
      ]);
    }
  };

  // Adicionar novo lead
  const handleAddLead = async () => {
    try {
      // Encontrar a primeira coluna para associar o lead
      const firstColumn = columns.find(col => col.position === 0) || columns[0];
      
      const leadData = {
        ...formData,
        columnId: firstColumn?.id || null, // Associar à primeira coluna
      };
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar lead');
      }

      const newLead = await response.json();
      await fetchLeads();
      setShowModal(false);
      resetForm();
      
      // Emitir evento de lead criado
      eventEmitter.emit(EVENTS.LEAD_CREATED, newLead);
    } catch (err) {
      console.error('Erro ao adicionar lead:', err);
      setError('Erro ao adicionar lead. Tente novamente.');
    }
  };

  // Atualizar lead existente
  const handleUpdateLead = async () => {
    if (!currentLead) return;

    try {
      // Se o lead não tem columnId, associar à primeira coluna
      let columnId = currentLead.columnId;
      if (!columnId) {
        const firstColumn = columns.find(col => col.position === 0) || columns[0];
        columnId = firstColumn?.id || null;
      }
      
      const response = await fetch(`/api/leads/${currentLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          position: currentLead.position,
          columnId: columnId
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar lead');
      }

      const updatedLead = await response.json();
      await fetchLeads();
      setShowModal(false);
      resetForm();
      
      // Emitir evento de lead atualizado
      eventEmitter.emit(EVENTS.LEAD_UPDATED, updatedLead);
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
      setError('Erro ao atualizar lead. Tente novamente.');
    }
  };

  // Excluir lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir lead');
      }

      await fetchLeads();
      
      // Emitir evento de lead deletado
      eventEmitter.emit(EVENTS.LEAD_DELETED, { id });
    } catch (err) {
      console.error('Erro ao excluir lead:', err);
      setError('Erro ao excluir lead. Tente novamente.');
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
      notes: lead.notes || ''
    });
    setShowModal(true);
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: 'Site',
      status: columns.length > 0 ? columns[0].id : 'novo',
      notes: ''
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

  // Manipular importação de arquivo Excel
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('❌ Formato de arquivo inválido. Use apenas arquivos Excel (.xlsx, .xls) ou CSV (.csv)');
      e.target.value = '';
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Arquivo não contém planilhas válidas');
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (!jsonData || jsonData.length === 0) {
        setError('❌ Arquivo está vazio ou não contém dados válidos.');
        e.target.value = '';
        return;
      }
      
      console.log('📊 Dados importados:', jsonData);
      setImportData(jsonData);
      setShowImportModal(true);
      setError(null); // Limpar erros anteriores
    } catch (error) {
      console.error('❌ Erro ao importar arquivo:', error);
      setError('❌ Erro ao processar arquivo. Verifique se é um arquivo Excel/CSV válido e tente novamente.');
    }
    
    // Limpar input
    e.target.value = '';
  };

  // Processar importação dos leads
  const processImport = async () => {
    if (importData.length === 0) return;
    
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Encontrar a primeira coluna para associar os leads
      const firstColumn = columns.find(col => col.position === 0) || columns[0];
      
      for (const row of importData) {
        try {
          const leadData = {
            name: row.Nome || row.nome || row.Name || row.name || '',
            email: row.Email || row.email || '',
            phone: row.Telefone || row.telefone || row.Phone || row.phone || '',
            source: row.Origem || row.origem || row.Source || row.source || 'Excel',
            notes: row.Observações || row.observacoes || row.Notes || row.notes || '',
            columnId: firstColumn?.id || null,
          };
          
          if (!leadData.name) {
            console.warn('⚠️ Lead sem nome ignorado:', row);
            errorCount++;
            continue;
          }
          
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(leadData),
          });
          
          if (response.ok) {
            const newLead = await response.json();
            successCount++;
            // Emitir evento de lead criado
            eventEmitter.emit(EVENTS.LEAD_CREATED, newLead);
          } else {
            errorCount++;
            console.error('❌ Erro ao criar lead:', leadData);
          }
        } catch (error) {
          errorCount++;
          console.error('❌ Erro ao processar linha:', row, error);
        }
      }
      
      await fetchLeads();
      setShowImportModal(false);
      setImportData([]);
      
      if (successCount > 0) {
        setError(`✅ ${successCount} leads importados com sucesso! ${errorCount > 0 ? `${errorCount} erros encontrados.` : ''}`);
      } else {
        setError('❌ Nenhum lead foi importado. Verifique o formato do arquivo.');
      }
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      setError('Erro durante a importação. Tente novamente.');
    } finally {
      setIsImporting(false);
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
          <div className="flex gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
              id="excel-import"
            />
            <label
              htmlFor="excel-import"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center gap-2"
            >
              📊 Importar Excel
            </label>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Adicionar Lead
            </button>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      Nenhum lead encontrado. Adicione um novo lead.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          lead.status === "novo" ? "bg-blue-900 text-blue-200" :
                          lead.status === "em-contato" ? "bg-yellow-900 text-yellow-200" :
                          lead.status === "qualificado" ? "bg-purple-900 text-purple-200" :
                          lead.status === "negociacao" ? "bg-orange-900 text-orange-200" :
                          "bg-green-900 text-green-200"
                        }`}>
                          {getStatusDisplayName(lead.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        <button 
                          onClick={() => openEditModal(lead)}
                          className="text-blue-400 hover:text-blue-300 mr-2"
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
      
      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Importar Leads do Excel</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">📋 Instruções para o arquivo Excel:</h4>
              <div className="bg-gray-700 p-4 rounded-md text-sm">
                <p className="mb-2">O arquivo deve conter as seguintes colunas (não obrigatórias, mas recomendadas):</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li><strong>Nome</strong> ou <strong>Name</strong> - Nome do lead (obrigatório)</li>
                  <li><strong>Email</strong> - Endereço de email</li>
                  <li><strong>Telefone</strong> ou <strong>Phone</strong> - Número de telefone</li>
                  <li><strong>Origem</strong> ou <strong>Source</strong> - Origem do lead</li>
                  <li><strong>Observações</strong> ou <strong>Notes</strong> - Notas adicionais</li>
                </ul>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-yellow-400">⚠️ Apenas leads com nome serão importados.</p>
                  <a 
                    href="/exemplo-planilha-leads.csv" 
                    download="exemplo-leads.csv"
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs"
                  >
                    📥 Baixar Exemplo
                  </a>
                </div>
              </div>
            </div>
            
            {importData.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">📊 Preview dos dados ({importData.length} registros):</h4>
                <div className="bg-gray-700 p-4 rounded-md max-h-40 overflow-y-auto">
                  <div className="text-xs">
                    {importData.slice(0, 3).map((row, index) => (
                      <div key={index} className="mb-2 p-2 bg-gray-600 rounded">
                        <div><strong>Nome:</strong> {row.Nome || row.nome || row.Name || row.name || 'N/A'}</div>
                        <div><strong>Email:</strong> {row.Email || row.email || 'N/A'}</div>
                        <div><strong>Telefone:</strong> {row.Telefone || row.telefone || row.Phone || row.phone || 'N/A'}</div>
                      </div>
                    ))}
                    {importData.length > 3 && (
                      <div className="text-gray-400">... e mais {importData.length - 3} registros</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportData([]);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
                disabled={isImporting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={processImport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-2"
                disabled={isImporting || importData.length === 0}
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Importando...
                  </>
                ) : (
                  <>📊 Importar {importData.length} Leads</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}