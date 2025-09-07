'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Phone, Mail, MessageSquare, Calendar, FileText, Users } from 'lucide-react';

interface Attendance {
  id: string;
  leadId: string;
  userId?: string;
  type: string;
  subject?: string;
  description?: string;
  status: string;
  priority: string;
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  tags?: string;
  attachments?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
}

const attendanceTypes = [
  { value: 'call', label: 'Ligação', icon: Phone, color: 'text-blue-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-green-500' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600' },
  { value: 'meeting', label: 'Reunião', icon: Users, color: 'text-purple-500' },
  { value: 'note', label: 'Anotação', icon: FileText, color: 'text-gray-500' },
  { value: 'follow_up', label: 'Follow-up', icon: Calendar, color: 'text-orange-500' }
];

const statusOptions = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' }
];

const priorityOptions = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-500' },
  { value: 'medium', label: 'Média', color: 'bg-blue-500' },
  { value: 'high', label: 'Alta', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500' }
];

const outcomeOptions = [
  { value: 'successful', label: 'Sucesso' },
  { value: 'no_answer', label: 'Não atendeu' },
  { value: 'callback', label: 'Retornar ligação' },
  { value: 'not_interested', label: 'Não interessado' },
  { value: 'converted', label: 'Convertido' }
];

export function AttendanceModal({ isOpen, onClose, leadId }: AttendanceModalProps) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call',
    subject: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    scheduledAt: '',
    duration: '',
    outcome: '',
    nextAction: '',
    tags: ''
  });

  useEffect(() => {
    if (isOpen && leadId) {
      loadAttendances();
      loadLead();
    }
  }, [isOpen, leadId]);

  const loadAttendances = async () => {
    if (!leadId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [AttendanceModal] Token de autenticação não encontrado');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/attendances?leadId=${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        console.error('❌ [AttendanceModal] Token expirado ou inválido');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setAttendances(data);
      }
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLead = async () => {
    if (!leadId) return;
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [AttendanceModal] Token de autenticação não encontrado');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        console.error('❌ [AttendanceModal] Token expirado ou inválido');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setLead(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lead:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ [AttendanceModal] Token de autenticação não encontrado');
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          leadId,
          scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
          duration: formData.duration ? parseInt(formData.duration) : null
        }),
      });
      
      if (response.status === 401) {
        console.error('❌ [AttendanceModal] Token expirado ou inválido');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        setShowForm(false);
        setFormData({
          type: 'call',
          subject: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          scheduledAt: '',
          duration: '',
          outcome: '',
          nextAction: '',
          tags: ''
        });
        loadAttendances();
      }
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = attendanceTypes.find(t => t.value === type);
    if (!typeConfig) return FileText;
    return typeConfig.icon;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = attendanceTypes.find(t => t.value === type);
    return typeConfig?.color || 'text-gray-500';
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = priorityOptions.find(p => p.value === priority);
    return priorityConfig?.color || 'bg-gray-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Histórico de Atendimento</h2>
            {lead && (
              <p className="text-gray-300 mt-1">
                {lead.name} {lead.email && `• ${lead.email}`} {lead.phone && `• ${lead.phone}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add Button and Legend */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Atendimento
            </button>
            
            {/* Icons Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-gray-300 font-medium">Legenda:</span>
              {attendanceTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <div key={type.value} className="flex items-center gap-1">
                    <IconComponent className={`w-4 h-4 ${type.color}`} />
                    <span className="text-gray-300">{type.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    >
                      {attendanceTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Assunto
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                      placeholder="Assunto do atendimento"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white h-24 resize-none"
                    placeholder="Descreva o atendimento..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    >
                      {priorityOptions.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Duração (min)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                      placeholder="Ex: 30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Agendado para
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Resultado
                    </label>
                    <select
                      value={formData.outcome}
                      onChange={(e) => setFormData({...formData, outcome: e.target.value})}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    >
                      <option value="">Selecione...</option>
                      {outcomeOptions.map(outcome => (
                        <option key={outcome.value} value={outcome.value}>
                          {outcome.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Próxima Ação
                  </label>
                  <textarea
                    value={formData.nextAction}
                    onChange={(e) => setFormData({...formData, nextAction: e.target.value})}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white h-20 resize-none"
                    placeholder="Descreva a próxima ação necessária..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    placeholder="Ex: urgente, callback, proposta"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Attendances List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Carregando atendimentos...</div>
            </div>
          ) : attendances.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Nenhum atendimento registrado ainda.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {attendances.map((attendance) => {
                const IconComponent = getTypeIcon(attendance.type);
                return (
                  <div key={attendance.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-gray-600 ${getTypeColor(attendance.type)}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {attendance.subject || attendanceTypes.find(t => t.value === attendance.type)?.label}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {formatDate(attendance.createdAt)}
                            {attendance.user && ` • ${attendance.user.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(attendance.priority)}`}>
                          {priorityOptions.find(p => p.value === attendance.priority)?.label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(attendance.status)}`}>
                          {statusOptions.find(s => s.value === attendance.status)?.label}
                        </span>
                      </div>
                    </div>
                    
                    {attendance.description && (
                      <p className="text-gray-300 mb-3">{attendance.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {attendance.duration && (
                        <span>Duração: {attendance.duration} min</span>
                      )}
                      {attendance.outcome && (
                        <span>Resultado: {outcomeOptions.find(o => o.value === attendance.outcome)?.label}</span>
                      )}
                      {attendance.scheduledAt && (
                        <span>Agendado: {formatDate(attendance.scheduledAt)}</span>
                      )}
                    </div>
                    
                    {attendance.nextAction && (
                      <div className="mt-3 p-2 bg-gray-600 rounded">
                        <p className="text-sm text-gray-300">
                          <strong>Próxima ação:</strong> {attendance.nextAction}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}