'use client';

import { useState, useEffect } from 'react';

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
  };
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  attendantName: string;
  attendantId: string;
}

interface Attendant {
  id: string;
  name: string;
  email: string;
  position?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

interface LeadModalProps {
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => void;
  columnId?: string;
  columnTitle?: string;
}

export function LeadModal({ lead, isOpen, onClose, onSave, columnId, columnTitle }: LeadModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
    attendantName: '',
    attendantId: ''
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentAttendant, setCurrentAttendant] = useState<any>(null);
  const [attendants, setAttendants] = useState<Attendant[]>([]);

  // Buscar dados do usuário logado
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        // Buscar atendente correspondente ao usuário logado
        fetchCurrentAttendant(user.email);
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAttendants();
    }
  }, [isOpen]);

  const fetchCurrentAttendant = async (userEmail: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/attendants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const attendants = await response.json();
        const attendant = attendants.find((att: any) => att.email === userEmail);
        if (attendant) {
          setCurrentAttendant(attendant);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar atendente:', error);
    }
  };

  const fetchAttendants = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token de autenticação não encontrado');
        return;
      }
      
      const response = await fetch('/api/attendants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const attendantsData = await response.json();
        setAttendants(attendantsData.filter((att: Attendant) => att.isActive));
      }
    } catch (error) {
      console.error('Erro ao buscar atendentes:', error);
    }
  };

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        notes: lead.notes || '',
        attendantName: lead.attendant?.name || '',
        attendantId: lead.attendantId || ''
      });
    } else {
      // Para novos leads, pré-preencher com o atendente atual
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: '',
        notes: '',
        attendantName: currentAttendant?.name || '',
        attendantId: currentAttendant?.id || ''
      });
    }
  }, [lead, isOpen, currentAttendant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: deve ter o título da coluna para novos leads
    if (!lead && !columnTitle) {
      alert('Erro: Nome do quadro não encontrado. Não é possível criar o lead.');
      return;
    }
    
    const leadData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      source: formData.source,
      notes: formData.notes,
      attendantId: formData.attendantId,
      ...(lead ? { id: lead.id } : {}),
      ...(columnId ? { columnId } : {})
    };
    onSave(leadData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {lead ? 'Editar Lead' : `Novo Lead${columnTitle ? ` - ${columnTitle}` : ''}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="Nome do lead"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Origem
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione a origem</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Indicação">Indicação</option>
              <option value="Telefone">Telefone</option>
              <option value="Email">Email</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Atendente *
            </label>
            <select
              value={formData.attendantId}
              onChange={(e) => {
                const selectedAttendant = attendants.find(att => att.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  attendantId: e.target.value,
                  attendantName: selectedAttendant?.name || ''
                });
              }}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um atendente</option>
              {attendants.map((attendant) => (
                <option key={attendant.id} value={attendant.id}>
                  {attendant.name} - {attendant.position?.name || 'Sem cargo'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              placeholder="Observações sobre o lead..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {lead ? 'Salvar' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}