'use client';

import { useState } from 'react';

interface AddColumnButtonProps {
  onAddColumn: (title: string) => void;
}

export default function AddColumnButton({ onAddColumn }: AddColumnButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');

  const handleStartCreating = () => {
    setIsCreating(true);
    setTitle('');
  };

  const handleSave = () => {
    if (title.trim()) {
      onAddColumn(title.trim());
      setIsCreating(false);
      setTitle('');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isCreating) {
    return (
      <div className="flex-shrink-0 w-80 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nome da coluna"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartCreating}
      className="flex-shrink-0 w-80 h-fit bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 flex items-center justify-center gap-2 min-h-[120px]"
    >
      <span className="text-2xl">+</span>
      <span className="font-medium">Adicionar Coluna</span>
    </button>
  );
}