'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface Attendant {
  id: string;
  name: string;
  email: string;
  position?: {
    id: string;
    name: string;
  } | string;
  department?: {
    id: string;
    name: string;
  } | string;
  isActive: boolean;
}

interface AttendantSelectorProps {
  leadId: string;
  currentAttendant?: {
    id: string;
    name: string;
    email: string;
    position?: {
      id: string;
      name: string;
    } | string;
    department?: {
      id: string;
      name: string;
    } | string;
    isActive: boolean;
  };
  onAssign: (attendantId: string | null) => Promise<void>;
  compact?: boolean;
}

export function AttendantSelector({ leadId, currentAttendant, onAssign, compact = false }: AttendantSelectorProps) {
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttendantId, setSelectedAttendantId] = useState<string | null>(currentAttendant?.id || null);
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchAttendants();
  }, []);

  const fetchAttendants = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [AttendantSelector] Token de autenticação não encontrado');
        return;
      }
      
      const response = await fetch('/api/attendants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        console.error('❌ [AttendantSelector] Token expirado ou inválido');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setAttendants(data);
      } else {
        console.error('❌ [AttendantSelector] Erro na resposta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar atendentes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (attendantId: string | null) => {
    try {
      await onAssign(attendantId);
      setSelectedAttendantId(attendantId);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao associar atendente:', error);
    }
  };

  const selectedAttendant = attendants.find(a => a.id === selectedAttendantId) || currentAttendant;

  if (compact) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">👨‍💼</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 text-left px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600 transition-colors"
          >
            {selectedAttendant ? selectedAttendant.name : 'Sem atendente'}
          </button>
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-50 max-h-48 overflow-y-auto">
            <button
              onClick={() => handleAssign(null)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 flex items-center gap-2 border-b"
            >
              <span className="text-red-500">❌</span>
              <span>Remover atendente</span>
            </button>
            {attendants.map((attendant) => (
              <button
                key={attendant.id}
                onClick={() => handleAssign(attendant.id)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 flex items-center gap-2"
              >
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {attendant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{attendant.name}</div>
                  <div className="text-gray-500">{typeof attendant.position === 'string' ? attendant.position : attendant.position?.name || 'Sem cargo'}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>👥</span>
          Atendente Responsável
        </h3>
        {currentAttendant && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Atribuído
          </span>
        )}
      </div>

      {/* Atendente atual */}
      {currentAttendant && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
            {currentAttendant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-medium">{currentAttendant.name}</div>
            <div className="text-sm text-gray-500">{currentAttendant.email}</div>
            <div className="text-sm text-gray-500">{typeof currentAttendant.position === 'string' ? currentAttendant.position : currentAttendant.position?.name || 'Sem cargo'}</div>
            {currentAttendant.department && (
              <div className="text-xs text-gray-400">{typeof currentAttendant.department === 'string' ? currentAttendant.department : currentAttendant.department?.name || ''}</div>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => handleAssign(null)}
              className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 text-sm transition-colors"
            >
              ❌ Remover
            </button>
          )}
        </div>
      )}

      {/* Seleção de atendente - apenas para administradores */}
      {isAdmin && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {currentAttendant ? 'Alterar atendente:' : 'Selecionar atendente:'}
          </label>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full text-left px-3 py-2 border rounded-md bg-white hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{selectedAttendant ? selectedAttendant.name : 'Selecione um atendente'}</span>
              <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
            </button>
            
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                {attendants.map((attendant) => (
                  <button
                    key={attendant.id}
                    onClick={() => handleAssign(attendant.id)}
                    className="w-full text-left px-3 py-3 hover:bg-gray-100 flex items-center gap-3 border-b last:border-b-0"
                  >
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-sm">
                      {attendant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{attendant.name}</div>
                      <div className="text-sm text-gray-500">{attendant.email}</div>
                      <div className="text-sm text-gray-500">{typeof attendant.position === 'string' ? attendant.position : attendant.position?.name || 'Sem cargo'}</div>
                      {attendant.department && (
                        <div className="text-xs text-gray-400">{typeof attendant.department === 'string' ? attendant.department : attendant.department?.name || ''}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensagem para usuários não-admin quando não há atendente */}
      {!isAdmin && !currentAttendant && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">Nenhum atendente associado</div>
          <div className="text-xs text-gray-500 mt-1">Apenas administradores podem associar atendentes</div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">Carregando atendentes...</div>
        </div>
      )}
    </div>
  );
}