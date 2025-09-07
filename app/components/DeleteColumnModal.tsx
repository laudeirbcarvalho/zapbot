'use client';

import { useState } from 'react';

interface DeleteColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  columnTitle: string;
  hasLeads: boolean;
  leadsCount?: number;
}

export default function DeleteColumnModal({
  isOpen,
  onClose,
  onConfirm,
  columnTitle,
  hasLeads,
  leadsCount = 0
}: DeleteColumnModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (hasLeads) return;
    
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !hasLeads) {
      handleConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            {hasLeads ? (
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              {hasLeads ? 'Não é possível mover para lixeira' : 'Mover coluna para lixeira'}
            </h3>
            <p className="text-sm text-gray-500">
              {columnTitle}
            </p>
          </div>
        </div>

        <div className="mb-6">
          {hasLeads ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Esta coluna contém <strong>{leadsCount} lead{leadsCount !== 1 ? 's' : ''}</strong> e será movida para lixeira junto com todos os leads.
              </p>
              <p className="text-sm text-gray-600">
                Você poderá restaurar a coluna e os leads pela lixeira posteriormente.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              Mover a coluna <strong>"{columnTitle}"</strong> para a lixeira?
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onClose}
            disabled={isDeleting}
          >
            'Cancelar'
          </button>
          <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Movendo...
                </div>
              ) : (
                'Mover para Lixeira'
              )}
            </button>
        </div>
      </div>
    </div>
  );
}