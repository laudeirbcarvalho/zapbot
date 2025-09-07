'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Clock, User, Tag, Calendar, AlertCircle } from 'lucide-react';

interface Attendance {
  id: string;
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

interface AttendantAttendanceModalProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
}

export default function AttendantAttendanceModal({ leadId, leadName, onClose }: AttendantAttendanceModalProps) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
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

  const attendanceTypes = [
    { value: 'call', label: 'Ligação', icon: '📞' },
    { value: 'email', label: 'E-mail', icon: '📧' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'meeting', label: 'Reunião', icon: '🤝' },
    { value: 'note', label: 'Anotação', icon: '📝' },
    { value: 'follow_up', label: 'Follow-up', icon: '🔄' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'text-yellow-400' },
    { value: 'completed', label: 'Concluído', color: 'text-green-400' },
    { value: 'cancelled', label: 'Cancelado', color: 'text-red-400' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', color: 'text-blue-400' },
    { value: 'medium', label: 'Média', color: 'text-yellow-400' },
    { value: 'high', label: 'Alta', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgente', color: 'text-red-400' }
  ];

  const outcomeOptions = [
    { value: 'successful', label: 'Bem-sucedido' },
    { value: 'no_answer', label: 'Não atendeu' },
    { value: 'callback', label: 'Retornar ligação' },
    { value: 'not_interested', label: 'Não interessado' },
    { value: 'converted', label: 'Convertido' }
  ];

  useEffect(() => {
    if (leadId) {
      loadAttendances();
    }
  }, [leadId]);

  const loadAttendances = async () => {
    if (!leadId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/attendant/attendances?leadId=${leadId}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendances(data);
      } else {
        console.error('Erro ao carregar atendimentos:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    try {
      const response = await fetch('/api/attendant/attendances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          leadId,
          scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
          duration: formData.duration ? parseInt(formData.duration) : null
        }),
      });

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
      } else {
        console.error('Erro ao salvar atendimento:', response.status);
      }
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTypeIcon = (type: string) => {
    const typeObj = attendanceTypes.find(t => t.value === type);
    return typeObj?.icon || '📝';
  };

  const getStatusColor = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.color || 'text-gray-400';
  };

  const getPriorityColor = (priority: string) => {
    const priorityObj = priorityOptions.find(p => p.value === priority);
    return priorityObj?.color || 'text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Atendimentos</h2>
            <p className="text-gray-400 text-sm mt-1">{leadName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add Attendance Button and Legend */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Novo Atendimento
            </button>
            
            {/* Legendas */}
            <div className="bg-gray-800 rounded-lg p-3 flex-1">
              <h4 className="text-xs font-medium text-gray-300 mb-2">Legenda:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-300">
                  <span>📞</span>
                  <span>Ligação</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <span>📧</span>
                  <span>Email</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <span>💬</span>
                  <span>WhatsApp</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <span>🤝</span>
                  <span>Reunião</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <span>📝</span>
                  <span>Anotação</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <span>🔄</span>
                  <span>Follow-up</span>
                </div>
              </div>
            </div>
          </div>

          {/* New Attendance Form */}
          {showForm && (
            <div className="bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Novo Atendimento</h3>
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
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
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
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
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
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Salvar Atendimento
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Attendances List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Carregando atendimentos...</p>
              </div>
            ) : attendances.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-400">Nenhum atendimento registrado ainda.</p>
                <p className="text-gray-500 text-sm mt-1">Clique em "Novo Atendimento" para começar.</p>
              </div>
            ) : (
              attendances.map((attendance) => (
                <div key={attendance.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(attendance.type)}</span>
                      <div>
                        <h4 className="text-white font-medium">
                          {attendance.subject || `${attendanceTypes.find(t => t.value === attendance.type)?.label || attendance.type}`}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span className={`font-medium ${getStatusColor(attendance.status)}`}>
                            {statusOptions.find(s => s.value === attendance.status)?.label || attendance.status}
                          </span>
                          <span className={`font-medium ${getPriorityColor(attendance.priority)}`}>
                            {priorityOptions.find(p => p.value === attendance.priority)?.label || attendance.priority}
                          </span>
                          {attendance.duration && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {attendance.duration}min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(attendance.createdAt)}
                    </span>
                  </div>

                  {attendance.description && (
                    <p className="text-gray-300 text-sm mb-3">{attendance.description}</p>
                  )}

                  {attendance.scheduledAt && (
                    <div className="flex items-center gap-2 text-sm text-blue-400 mb-2">
                      <Calendar size={14} />
                      <span>Agendado: {formatDate(attendance.scheduledAt)}</span>
                    </div>
                  )}

                  {attendance.outcome && (
                    <div className="text-sm text-gray-400 mb-2">
                      <strong>Resultado:</strong> {outcomeOptions.find(o => o.value === attendance.outcome)?.label || attendance.outcome}
                    </div>
                  )}

                  {attendance.nextAction && (
                    <div className="text-sm text-gray-400 mb-2">
                      <strong>Próxima ação:</strong> {attendance.nextAction}
                    </div>
                  )}

                  {attendance.tags && (
                    <div className="flex items-center gap-2 mt-3">
                      <Tag size={14} className="text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {attendance.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-600 text-xs text-gray-300 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}