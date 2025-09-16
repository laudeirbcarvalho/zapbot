'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AttendantSelector } from './AttendantSelector';

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

interface KanbanCardProps {
  lead: Lead;
  onEditLead?: (leadData: Partial<Lead>) => void;
  onOpenAttendance?: (leadId: string) => void;
  onAssignAttendant?: (leadId: string, attendantId: string | null) => Promise<void>;
  onDeleteLead?: (leadId: string) => void;
  columnColor?: string;
}

export function KanbanCard({ lead, onEditLead, onOpenAttendance, onAssignAttendant, onDeleteLead, columnColor }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone || '',
    source: lead.source || '',
    notes: lead.notes || ''
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (onEditLead) {
      await onEditLead({ ...editData, id: lead.id });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || '',
      notes: lead.notes || ''
    });
    setIsEditing(false);
  };

  const handleOpenAttendance = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenAttendance) {
      onOpenAttendance(lead.id);
    }
  };

  const handleAssignAttendant = async (attendantId: string | null) => {
    if (onAssignAttendant) {
      await onAssignAttendant(lead.id, attendantId);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteLead && confirm('Tem certeza que deseja excluir este lead?')) {
      onDeleteLead(lead.id);
    }
  };

  return (
    <div className="relative">
      {/* Botões de ação posicionados fora do card */}
      {!isEditing && (
        <div className="absolute -top-2 -right-2 z-10 flex flex-col gap-1">
          {/* Botão de edição */}
          <button
            onClick={handleEdit}
            className="bg-gray-600 border border-gray-500 rounded-full w-6 h-6 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-500 transition-colors shadow-sm"
            title="Editar lead"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          {/* Botão de atendimento */}
          <button
            onClick={handleOpenAttendance}
            className="bg-green-600 border border-green-500 rounded-full w-6 h-6 flex items-center justify-center text-green-100 hover:text-white hover:bg-green-500 transition-colors shadow-sm"
            title="Histórico de atendimento"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          
          {/* Botão de exclusão */}
          <button
            onClick={handleDelete}
            className="bg-red-600 border border-red-500 rounded-full w-6 h-6 flex items-center justify-center text-red-100 hover:text-white hover:bg-red-500 transition-colors shadow-sm"
            title="Excluir lead"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
      
      <div
        ref={setNodeRef}
        style={style}
        {...(!isEditing ? attributes : {})}
        {...(!isEditing ? listeners : {})}
        className={`bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 shadow-lg border border-gray-600 ${!isEditing ? 'cursor-grab hover:shadow-xl hover:border-blue-500' : 'border-blue-400'} transition-all duration-200 relative ${
          isDragging ? 'opacity-50 rotate-2 scale-105' : ''
        }`}
      >
        {/* Barra colorida lateral */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: columnColor || '#6B7280' }}
        ></div>
        {/* Header com nome e status */}
        <div className="flex items-center justify-between mb-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="font-bold text-white text-lg bg-gray-600 border border-gray-500 rounded px-2 py-1 flex-1 mr-2"
              placeholder="Nome do lead"
            />
          ) : (
            <div className="font-bold text-white text-lg">{lead.name}</div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      
      {/* Contato */}
      <div className="space-y-2 mb-3">
        {/* CPF/CNPJ */}
        {(lead.cpf || lead.cnpj) && (
          <div className="flex items-center text-sm text-gray-300">
            <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-4 0a2 2 0 012-2h2a2 2 0 012 2v2m-4 0v6m0-6h4" />
            </svg>
            <span className="truncate">{lead.cpf ? `CPF: ${lead.cpf}` : `CNPJ: ${lead.cnpj}`}</span>
          </div>
        )}
        
        {/* Email */}
        <div className="flex items-center text-sm text-gray-300">
          <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
          {isEditing ? (
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({...editData, email: e.target.value})}
              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm flex-1"
              placeholder="Email"
            />
          ) : (
            <span className="truncate">{lead.email || 'Sem email'}</span>
          )}
        </div>
        
        {/* Telefone */}
        <div className="flex items-center text-sm text-gray-300">
          <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {isEditing ? (
            <input
              type="tel"
              value={editData.phone}
              onChange={(e) => setEditData({...editData, phone: e.target.value})}
              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm flex-1"
              placeholder="Telefone"
            />
          ) : (
            <span className="truncate">{lead.phone || 'Sem telefone'}</span>
          )}
        </div>
      </div>
      
      {/* Endereço */}
      {(lead.logradouro || lead.municipio) && (
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-300">
            <svg className="w-4 h-4 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">
              {lead.logradouro && lead.numero ? `${lead.logradouro}, ${lead.numero}` : lead.logradouro}
              {lead.municipio && ` - ${lead.municipio}`}
              {lead.uf && `/${lead.uf}`}
            </span>
          </div>
        </div>
      )}
      
      {/* Fonte */}
      <div className="mb-3">
        {isEditing ? (
          <input
            type="text"
            value={editData.source}
            onChange={(e) => setEditData({...editData, source: e.target.value})}
            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-xs w-full"
            placeholder="Fonte do lead"
          />
        ) : (
          lead.source && (
            <span className="inline-block bg-blue-600 text-blue-100 text-xs px-2 py-1 rounded-full">
              {lead.source}
            </span>
          )
        )}
      </div>
      
      {/* Notas */}
      <div className="mb-3">
        {isEditing ? (
          <textarea
            value={editData.notes}
            onChange={(e) => setEditData({...editData, notes: e.target.value})}
            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm w-full h-16 resize-none"
            placeholder="Notas sobre o lead"
          />
        ) : (
          lead.notes && (
            <p className="text-sm text-gray-300 bg-gray-900 p-2 rounded border-l-4 border-blue-400">
              {lead.notes}
            </p>
          )
        )}
      </div>
      
      {/* Atendente Responsável */}
      {!isEditing && (
        <div className="mb-3">
          <AttendantSelector
            leadId={lead.id}
            currentAttendant={lead.attendant}
            onAssign={handleAssignAttendant}
            compact={true}
          />
        </div>
      )}
      
      {/* Footer com botões de ação */}
      {isEditing && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-600">
          <button
            onClick={handleCancel}
            className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors"
          >
            Salvar
          </button>
        </div>
      )}
      </div>
    </div>
  );
}