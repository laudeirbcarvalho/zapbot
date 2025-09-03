"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

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
}

interface KanbanCardProps {
  id: string;
  lead: Lead;
  onUpdate: (data: Partial<Lead>) => void;
  onDelete: () => void;
}

export default function KanbanCard({
  id,
  lead,
  onUpdate,
  onDelete,
}: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(lead);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "lead",
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onUpdate(editData);
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-700 p-3 rounded shadow-md transition-all duration-200 ${
        isEditing ? 'cursor-default ring-2 ring-blue-500' : 'cursor-grab hover:bg-gray-600'
      }`}
      {...(!isEditing ? attributes : {})}
      {...(!isEditing ? listeners : {})}
      onDoubleClick={() => {
        if (!isDragging) {
          setIsEditing(true);
        }
      }}
    >
      {isEditing ? (
        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleChange}
                className="w-full bg-gray-600 text-white px-2 py-1 rounded"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={editData.email || ""}
                onChange={handleChange}
                className="w-full bg-gray-600 text-white px-2 py-1 rounded"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Telefone</label>
              <input
                type="text"
                name="phone"
                value={editData.phone || ""}
                onChange={handleChange}
                className="w-full bg-gray-600 text-white px-2 py-1 rounded"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Origem</label>
              <input
                type="text"
                name="source"
                value={editData.source || ""}
                onChange={handleChange}
                className="w-full bg-gray-600 text-white px-2 py-1 rounded"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notas</label>
              <textarea
                name="notes"
                value={editData.notes || ""}
                onChange={handleChange}
                className="w-full bg-gray-600 text-white px-2 py-1 rounded"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  setEditData(lead);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-1 rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
              >
                🗑️
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div>
          <div className="font-medium text-white">{lead.name}</div>
          {lead.email && (
            <div className="text-sm text-gray-300 mt-1">{lead.email}</div>
          )}
          {lead.phone && (
            <div className="text-sm text-gray-300">{lead.phone}</div>
          )}
          {lead.source && (
            <div className="text-xs text-gray-400 mt-2">
              Origem: {lead.source}
            </div>
          )}
          {lead.notes && (
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              {lead.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}