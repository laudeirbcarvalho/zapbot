'use client';

import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import DeleteColumnModal from './DeleteColumnModal';
import { useAuth } from '../hooks/useAuth';

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
}

interface KanbanColumnProps {
  column: Column;
  leads: Lead[];
  onEditColumn?: (columnId: string, newTitle: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onAddLead?: (columnId: string) => void;
  onEditLead?: (lead: Lead) => void;
  onOpenAttendance?: (leadId: string) => void;
  onAssignAttendant?: (leadId: string, attendantId: string | null) => Promise<void>;
  onDeleteLead?: (leadId: string) => Promise<void>;
  onUpdateColumn?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

export function KanbanColumn({ column, leads, onEditColumn, onDeleteColumn, onAddLead, onEditLead, onOpenAttendance, onAssignAttendant, onDeleteLead, onUpdateColumn, canEdit = true, canDelete = true, canCreate = true }: KanbanColumnProps) {
  const { isAdmin } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setEditTitle(column.title);
  }, [column.title]);
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 min-w-[300px] max-w-[300px] shadow-xl hover:shadow-2xl transition-shadow duration-200">
      {/* Barra colorida no topo */}
      <div 
        className="h-1 rounded-t-xl -mx-4 -mt-4 mb-4"
        style={{ backgroundColor: column.color || '#6B7280' }}
      ></div>
      {/* Header da coluna */}
      <div className="mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => {
                if (onEditColumn && editTitle.trim() !== column.title) {
                  onEditColumn(column.id, editTitle.trim());
                }
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (onEditColumn && editTitle.trim() !== column.title) {
                    onEditColumn(column.id, editTitle.trim());
                  }
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setEditTitle(column.title);
                  setIsEditingTitle(false);
                }
              }}
              className="font-bold text-white text-lg bg-transparent border-b-2 border-blue-400 focus:outline-none flex-1"
              autoFocus
            />
          ) : (
            <h3 
              className={`font-bold text-white text-lg flex-1 ${
                canEdit && isAdmin ? 'cursor-pointer hover:text-blue-400 transition-colors' : 'cursor-default'
              }`}
              onClick={canEdit && isAdmin ? () => setIsEditingTitle(true) : undefined}
              title={canEdit && isAdmin ? "Clique para editar" : "Apenas administradores podem editar"}
            >
              {column.title}
            </h3>
          )}
          <div className="flex items-center gap-2">
            {/* Seletor de cor - apenas para administradores */}
            {isAdmin && (
              <input
                type="color"
                value={column.color || '#6B7280'}
                onChange={canEdit ? async (e) => {
                   try {
                     // Atualizar cor via API
                     const token = localStorage.getItem('authToken');
                     await fetch(`/api/columns/${column.id}`, {
                       method: 'PUT',
                       headers: { 
                         'Content-Type': 'application/json',
                         ...(token && { 'Authorization': `Bearer ${token}` })
                       },
                       body: JSON.stringify({ color: e.target.value })
                     });
                     // Recarregar dados para refletir a mudança
                     if (onUpdateColumn) {
                       onUpdateColumn();
                     }
                   } catch (error) {
                     console.error('Erro ao atualizar cor da coluna:', error);
                   }
                 } : undefined}
                disabled={!canEdit}
                className="w-6 h-6 rounded border-none cursor-pointer"
                title="Escolher cor da coluna"
              />
            )}
            {/* Botão de exclusão - apenas para administradores */}
            {isAdmin && (
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="transition-colors text-gray-400 hover:text-red-400"
                title="Mover para lixeira"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded-full">{leads.length} leads</div>
          <button 
            onClick={onAddLead ? () => onAddLead(column.id) : undefined}
            className="text-sm px-3 py-1 rounded-lg transition-colors duration-200 flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Lead
          </button>
        </div>
      </div>

      {/* Área de drop */}
      <div
        ref={setNodeRef}
        className="min-h-[400px] space-y-3"
      >
        <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard 
              key={lead.id} 
              lead={lead} 
              onEditLead={onEditLead}
              onOpenAttendance={onOpenAttendance}
              onAssignAttendant={onAssignAttendant}
              onDeleteLead={onDeleteLead}
              columnColor={column.color}
            />
          ))}
        </SortableContext>
        
        {/* Área vazia para drop */}
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-lg text-gray-400">
            Arraste leads para cá
          </div>
        )}
      </div>

      <DeleteColumnModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDeleteColumn && onDeleteColumn(column.id);
          setShowDeleteModal(false);
        }}
        columnTitle={column.title}
        hasLeads={leads.length > 0}
        leadsCount={leads.length}
      />
    </div>
  );
}