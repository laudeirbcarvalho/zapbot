"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Header from "@/app/components/Header";
import { useState, useEffect } from "react";
import { useColumnSync } from "@/app/hooks/useColumnSync";

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
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Site',
    status: 'novo',
    notes: ''
  });

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
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar lead');
      }

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
      const response = await fetch(`/api/leads/${currentLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          position: currentLead.position,
          columnId: currentLead.columnId
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar lead');
      }

      await fetchLeads();
      setShowModal(false);
      resetForm();
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
          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Adicionar Lead
          </button>
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
                          {lead.status}
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
    </div>
  );
}