'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from '../../components/KanbanColumn';
import { KanbanCard } from '../../components/KanbanCard';
import { LeadModal } from '../../components/LeadModal';
import { AttendanceModal } from '../../components/AttendanceModal';
import AddColumnButton from '../../components/AddColumnButton';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';
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
  columnId?: string;
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
  leads: Lead[];
}

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLeadColumnId, setNewLeadColumnId] = useState<string | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const helpData = getHelpData('kanban');
  
  const { isAdmin, userId, isLoading } = useAuth();

  const loadData = async () => {
    try {
      setDataLoading(true);
      
      // Aguardar o carregamento da autenticação
      if (isLoading) {
        return;
      }
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [Kanban] Token de autenticação não encontrado');
        window.location.href = '/login';
        return;
      }
      
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const data = await authenticatedFetch('/api/kanban');
      setColumns(data.columns);
      console.log('📊 [Kanban] Dados carregados:', data.stats);
    } catch (error) {
      console.error('❌ [Kanban] Erro ao carregar dados:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (!isLoading) {
      loadData();
    }
  }, [isLoading]);

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

  // Iniciar drag
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Finalizar drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar o lead que está sendo movido
    let activeLead: Lead | undefined;
    let sourceColumn: Column | undefined;
    
    for (const column of columns) {
      const lead = column.leads.find(l => l.id === activeId);
      if (lead) {
        activeLead = lead;
        sourceColumn = column;
        break;
      }
    }

    if (!activeLead || !sourceColumn) return;

    // Determinar a coluna de destino
    let targetColumnId: string;
    let targetColumn: Column | undefined;

    if (overId.startsWith('column-')) {
      targetColumnId = overId.replace('column-', '');
      targetColumn = columns.find(col => col.id === targetColumnId);
    } else {
      // Dropped on another lead
      targetColumn = columns.find(col => 
        col.leads.some(lead => lead.id === overId)
      );
      if (targetColumn) {
        targetColumnId = targetColumn.id;
      }
    }

    if (!targetColumn) return;

    // Se não mudou de coluna e posição, não fazer nada
    if (sourceColumn.id === targetColumnId && activeId === overId) return;

    console.log('🔄 [Kanban] Lead movido - ID:', activeId, 'De:', sourceColumn.title, 'Para:', targetColumn.title);

    // Calcular nova posição baseada em onde foi solto
    let newPosition = 0;
    if (overId.startsWith('column-')) {
      // Solto na coluna vazia ou no final
      newPosition = targetColumn.leads.length;
    } else {
      // Solto em cima de outro lead
      const targetLead = targetColumn.leads.find(lead => lead.id === overId);
      if (targetLead) {
        newPosition = targetLead.position;
      } else {
        newPosition = targetColumn.leads.length;
      }
    }

    // Atualizar estado local imediatamente para feedback visual
    const updatedColumns = columns.map(col => {
      if (col.id === sourceColumn.id) {
        // Remover lead da coluna origem
        return {
          ...col,
          leads: col.leads.filter(lead => lead.id !== activeId)
        };
      } else if (col.id === targetColumnId) {
        // Adicionar lead na coluna destino
        const updatedLead = { ...activeLead!, columnId: targetColumnId, position: newPosition };
        const newLeads = [...col.leads];
        
        // Inserir na posição correta
        newLeads.splice(newPosition, 0, updatedLead);
        
        // Reordenar posições
        return {
          ...col,
          leads: newLeads.map((lead, index) => ({ ...lead, position: index }))
        };
      }
      return col;
    });

    // Atualizar estado local
    setColumns(updatedColumns);

    // Preparar atualizações para o backend
    const updates: Array<{id: string; columnId?: string; position: number}> = [];
    
    // Atualizar o lead movido
    updates.push({
      id: activeId,
      columnId: targetColumnId,
      position: newPosition
    });

    // Atualizar posições dos outros leads na coluna destino se necessário
    const targetColumnLeads = updatedColumns.find(col => col.id === targetColumnId)?.leads || [];
    targetColumnLeads.forEach((lead, index) => {
      if (lead.id !== activeId && lead.position !== index) {
        updates.push({
          id: lead.id,
          position: index
        });
      }
    });

    // Sincronizar com backend
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [Kanban] Token de autenticação não encontrado');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      const { authenticatedFetch } = await import('@/app/lib/api-client');
      await authenticatedFetch('/api/kanban/reorder', {
        method: 'POST',
        body: { updates }
      });
    } catch (error) {
      console.error('❌ [Kanban] Erro ao mover lead:', error);
      // Reverter mudanças locais em caso de erro
      setColumns(columns); // Restaurar estado anterior
    }
  };

  // Encontrar o lead ativo para o overlay
  const activeLead = activeId ? 
    columns.flatMap(col => col.leads).find(lead => lead.id === activeId) : null;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando Kanban...</div>
      </div>
    );
  }

  // Função para editar título da coluna
  const handleEditColumn = async (columnId: string, newTitle: string) => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      await authenticatedFetch(`/api/kanban/columns/${columnId}`, {
        method: 'PUT',
        body: { title: newTitle }
      });
      
      setColumns(prev => prev.map(col => 
        col.id === columnId ? { ...col, title: newTitle } : col
      ));
    } catch (error) {
      console.error('Erro ao editar coluna:', error);
    }
  };

  // Função para mover coluna para lixeira (soft delete)
  const handleDeleteColumn = async (columnId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [Kanban] Token de autenticação não encontrado');
        window.location.href = '/login';
        return;
      }

      const { authenticatedFetch } = await import('@/app/lib/api-client');
      await authenticatedFetch(`/api/kanban/columns/${columnId}`, {
        method: 'DELETE'
      });
      
      // Atualizar estado local instantaneamente
      setColumns(prev => prev.filter(col => col.id !== columnId));
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
    }
  };

  // Função para adicionar nova coluna
  const handleAddColumn = async (title: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [Kanban] Token de autenticação não encontrado');
        window.location.href = '/login';
        return;
      }

      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const data = await authenticatedFetch('/api/kanban/columns', {
        method: 'POST',
        body: { 
          title: title,
          position: columns.length
        }
      });
      
      const newColumn = data.column;
      // Atualizar estado local instantaneamente
      setColumns(prev => [...prev, { ...newColumn, leads: [] }]);
    } catch (error) {
      console.error('Erro ao adicionar coluna:', error);
    }
  };

  // Função para adicionar novo lead
  const handleAddLead = (columnId: string) => {
    setNewLeadColumnId(columnId);
    handleOpenLeadModal();
  };

  // Função para editar lead inline
  const handleEditLead = async (leadData: Partial<Lead>) => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const updatedLead = await authenticatedFetch(`/api/leads/${leadData.id}`, {
        method: 'PUT',
        body: leadData
      });
      
      // Atualizar estado local instantaneamente
      setColumns(prev => prev.map(col => ({
        ...col,
        leads: col.leads.map(lead => 
          lead.id === updatedLead.id ? updatedLead : lead
        )
      })));
    } catch (error) {
      console.error('Erro ao editar lead:', error);
    }
  };

  // Função para abrir modal de novo lead
  const handleOpenLeadModal = (lead?: Lead) => {
    setEditingLead(lead || null);
    // Só resetar newLeadColumnId se estiver editando um lead existente
    if (lead) {
      setNewLeadColumnId(null);
    }
    setModalOpen(true);
  };

  const handleOpenAttendance = (leadId: string) => {
    setSelectedLeadId(leadId);
    setAttendanceModalOpen(true);
  };

  // Função para associar/desassociar atendente
  const handleAssignAttendant = async (leadId: string, attendantId: string | null) => {
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const result = await authenticatedFetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        body: { attendantId }
      });
      
      // Atualizar estado local instantaneamente
      setColumns(prev => prev.map(col => ({
        ...col,
        leads: col.leads.map(lead => 
          lead.id === leadId ? result.lead : lead
        )
      })));
      
      console.log('✅ Atendente associado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao associar atendente:', error);
      alert('Erro ao associar atendente. Tente novamente.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead? Ele será movido para a lixeira.')) {
      return;
    }
    
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      await authenticatedFetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      
      // Recarregar dados para refletir a mudança
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      alert('Erro ao excluir lead. Tente novamente.');
    }
  };

  // Função para salvar lead (criar ou editar)
  const handleSaveLead = async (leadData: Partial<Lead>) => {
    try {
      const isEditing = !!editingLead;
      const url = isEditing ? `/api/leads/${editingLead.id}` : '/api/leads';
      const method = isEditing ? 'PUT' : 'POST';
      
      const columnId = leadData.columnId || newLeadColumnId;
      const column = columns.find(col => col.id === columnId);
      
      if (!column?.title) {
        alert('Erro: Nome do quadro não encontrado. Não é possível salvar o lead.');
        return;
      }
      
      const body = {
        ...leadData,
        columnId: columnId,
        status: column.title // Status deve ser sempre o título da coluna
      };
      
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const savedLead = await authenticatedFetch(url, {
        method,
        body
      });
      
      if (isEditing) {
        // Atualizar lead existente
        setColumns(prev => prev.map(col => ({
          ...col,
          leads: col.leads.map(lead => 
            lead.id === savedLead.id ? savedLead : lead
          )
        })));
      } else {
        // Adicionar novo lead
        setColumns(prev => prev.map(col => 
          col.id === savedLead.columnId 
            ? { ...col, leads: [...col.leads, savedLead] }
            : col
        ));
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <Header title="Kanban" />
      
      {/* Seção de título com botão de ajuda */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kanban - Funil de Vendas</h1>
          <p className="text-gray-400 mt-1">Gerencie visualmente o progresso dos seus leads através do processo de vendas</p>
        </div>
        <button
          onClick={() => setShowHelpModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          title="Ajuda sobre Kanban"
        >
          <span className="text-lg">❓</span>
          Ajuda
        </button>
      </div>
      
      <div className="mt-6">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                leads={column.leads}
                onEditColumn={handleEditColumn}
                onDeleteColumn={handleDeleteColumn}
                onAddLead={handleAddLead}
                onEditLead={handleEditLead}
                onOpenAttendance={handleOpenAttendance}
                onAssignAttendant={handleAssignAttendant}
                onDeleteLead={handleDeleteLead}
                onUpdateColumn={loadData}
                canEdit={isAdmin}
                canDelete={isAdmin}
                canCreate={true}
              />
            ))}
            {/* Botão de adicionar coluna - apenas para administradores */}
            {isAdmin && <AddColumnButton onAddColumn={handleAddColumn} />}
          </div>

          <DragOverlay>
            {activeLead ? (
              <KanbanCard lead={activeLead} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <LeadModal
        lead={editingLead}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLead(null);
          setNewLeadColumnId(null);
        }}
        onSave={handleSaveLead}
        columnId={newLeadColumnId || undefined}
        columnTitle={editingLead ? 
          columns.find(col => col.id === editingLead.columnId)?.title :
          columns.find(col => col.id === newLeadColumnId)?.title
        }
      />
      
        <AttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => {
          setAttendanceModalOpen(false);
          setSelectedLeadId(null);
        }}
        leadId={selectedLeadId}
      />
      
      {/* Modal de Ajuda */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        moduleName={helpData.moduleName}
        steps={helpData.steps}
      />
    </div>
  );
}