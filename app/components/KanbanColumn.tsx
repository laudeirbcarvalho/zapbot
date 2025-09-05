"use client";

import { useSortable, SortableContext } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface KanbanColumnProps {
  id: string;
  title: string;
  children: React.ReactNode;
  leads: any[];
  onAddCard: () => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
  isDropTarget?: boolean;
  isDragging?: boolean;
}

export default function KanbanColumn({
  id,
  title,
  children,
  leads,
  onAddCard,
  onUpdateTitle,
  onDelete,
  isDropTarget = false,
  isDragging = false,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [columnTitle, setColumnTitle] = useState(title);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    data: {
      type: "column",
    },
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      accepts: ["lead"],
    },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setSortableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setColumnTitle(e.target.value);
  }

  function handleTitleSubmit() {
    if (columnTitle.trim()) {
      onUpdateTitle(columnTitle);
    } else {
      setColumnTitle(title);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setColumnTitle(title);
      setIsEditing(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col bg-gray-800 rounded-lg shadow-lg min-w-[300px] max-w-[300px] h-full transition-all duration-200 ${
        isDropTarget ? 'ring-4 ring-green-400 bg-green-900/20 scale-105 shadow-2xl' :
        isOver ? 'ring-2 ring-blue-400 bg-gray-750' : ''
      } ${
        isDragging && !isDropTarget ? 'opacity-70' : ''
      }`}
    >
      <div
        className={`p-3 font-semibold text-white rounded-t-lg flex justify-between items-center cursor-grab transition-all duration-200 ${
          isDropTarget ? 'bg-green-600 animate-pulse' : 'bg-gray-700'
        }`}
        {...attributes}
        {...listeners}
      >
        {isEditing ? (
          <input
            type="text"
            value={columnTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            className="bg-gray-600 text-white px-2 py-1 rounded w-full"
            autoFocus
          />
        ) : (
          <div className="flex-1" onClick={() => setIsEditing(true)}>
            {columnTitle}
          </div>
        )}
        <div className="flex space-x-2">
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={leads.map(lead => `lead-${lead.id}`)}>
          {children}
        </SortableContext>
      </div>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={onAddCard}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center"
        >
          <span className="mr-1">+</span> Adicionar Lead
        </button>
      </div>
    </div>
  );
}