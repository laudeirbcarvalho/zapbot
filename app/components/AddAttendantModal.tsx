'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AddAttendantModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAttendantModal({ onClose, onSuccess }: AddAttendantModalProps) {
  const { isAdmin, userId, userType } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    cpf: '',
    positionId: '',
    functionId: '',
    departmentId: '',
    managerId: '',
    startTime: '',
    endTime: '',
    workDays: [] as string[],
    isActive: true,
    photoUrl: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Array<{id: string, name: string}>>([]);
  const [functions, setFunctions] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  const [managers, setManagers] = useState<Array<{id: string, name: string}>>([]);
  const [loadingData, setLoadingData] = useState(true);

  const weekDays = [
    { value: '1', label: 'Segunda-feira' },
    { value: '2', label: 'Terça-feira' },
    { value: '3', label: 'Quarta-feira' },
    { value: '4', label: 'Quinta-feira' },
    { value: '5', label: 'Sexta-feira' },
    { value: '6', label: 'Sábado' },
    { value: '0', label: 'Domingo' }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const [positionsRes, functionsRes, departmentsRes, managersRes] = await Promise.all([
          fetch('/api/positions', { headers }),
          fetch('/api/functions', { headers }),
          fetch('/api/departments', { headers }),
          fetch('/api/users?userType=MANAGER', { headers })
        ]);

        if (positionsRes.ok) {
          const positionsData = await positionsRes.json();
          setPositions(positionsData);
        }

        if (functionsRes.ok) {
          const functionsData = await functionsRes.json();
          setFunctions(functionsData);
        }

        if (departmentsRes.ok) {
          const departmentsData = await departmentsRes.json();
          setDepartments(departmentsData);
        }

        if (managersRes.ok) {
          const managersData = await managersRes.json();
          let managersList = managersData.users || managersData;
          
          // Se for gerente, garantir que ele esteja na lista e seja o único disponível
          if (userType === 'MANAGER' && userId) {
            // Obter nome do usuário logado do storage
            const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
            let currentUserName = 'Gerente Atual';
            if (userData) {
              try {
                const user = JSON.parse(userData);
                currentUserName = user.name || 'Gerente Atual';
              } catch (e) {
                console.error('Erro ao parsear dados do usuário:', e);
              }
            }
            
            const currentUserData = {
              id: userId,
              name: currentUserName
            };
            managersList = [currentUserData];
            setFormData(prev => ({ ...prev, managerId: userId }));
          }
          
          // Se for administrador, pré-preencher com ele mesmo como gerente responsável
          if (userType === 'ADMIN' && userId) {
            // Obter nome do usuário logado do storage
            const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
            let currentUserName = 'Administrador Atual';
            if (userData) {
              try {
                const user = JSON.parse(userData);
                currentUserName = user.name || 'Administrador Atual';
              } catch (e) {
                console.error('Erro ao parsear dados do usuário:', e);
              }
            }
            
            // Adicionar o administrador à lista de gerentes se não estiver
            const adminExists = managersList.find(manager => manager.id === userId);
            if (!adminExists) {
              const currentAdminData = {
                id: userId,
                name: currentUserName
              };
              managersList = [currentAdminData, ...managersList];
            }
            
            setFormData(prev => ({ ...prev, managerId: userId }));
          }
          
          setManagers(managersList);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'isActive') {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else {
        // Para workDays
        setFormData(prev => ({
          ...prev,
          workDays: checked 
            ? [...prev.workDays, value]
            : prev.workDays.filter(day => day !== value)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (máx. 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A foto deve ter no máximo 5MB');
        return;
      }

      // Validar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      setPhotoFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Token de autenticação não encontrado');
        setLoading(false);
        return;
      }

      let photoUrl = '';
      
      // Upload da foto se houver uma selecionada
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('file', photoFile);
        
        const uploadResponse = await fetch('/api/upload/attendant-photo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: photoFormData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoUrl = uploadData.url;
        } else {
          setError('Erro ao fazer upload da foto');
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/attendants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          photoUrl,
          workDays: formData.workDays.join(',')
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao criar atendente');
      }
    } catch (error) {
      setError('Erro ao criar atendente');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Adicionar Novo Atendente</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-300 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite a senha do atendente"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {/* Foto do Atendente */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Foto do Atendente
              </label>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-2xl">
                      👤
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Informações Profissionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Cargo *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Nome do novo cargo:');
                      if (name) {
                        const token = localStorage.getItem('authToken');
                        fetch('/api/positions', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` })
                          },
                          body: JSON.stringify({ name })
                        }).then(res => res.json()).then(newPosition => {
                          setPositions(prev => [...prev, newPosition]);
                          setFormData(prev => ({ ...prev, positionId: newPosition.id }));
                        }).catch(console.error);
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    + Novo Cargo
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    name="positionId"
                    value={formData.positionId}
                    onChange={handleInputChange}
                    required
                    disabled={loadingData}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um cargo</option>
                    {positions.map(position => (
                      <option key={position.id} value={position.id}>
                        {position.name}
                      </option>
                    ))}
                  </select>
                  {formData.positionId && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja excluir este cargo?')) {
                          try {
                            const token = localStorage.getItem('authToken');
                            await fetch(`/api/positions/${formData.positionId}`, { 
                              method: 'DELETE',
                              ...(token && { headers: { 'Authorization': `Bearer ${token}` } })
                            });
                            setPositions(prev => prev.filter(p => p.id !== formData.positionId));
                            setFormData(prev => ({ ...prev, positionId: '' }));
                          } catch (error) {
                            console.error('Erro ao excluir cargo:', error);
                          }
                        }
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Função *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Nome da nova função:');
                      if (name) {
                        const token = localStorage.getItem('authToken');
                        fetch('/api/functions', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` })
                          },
                          body: JSON.stringify({ name })
                        }).then(res => res.json()).then(newFunction => {
                          setFunctions(prev => [...prev, newFunction]);
                          setFormData(prev => ({ ...prev, functionId: newFunction.id }));
                        }).catch(console.error);
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    + Nova Função
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    name="functionId"
                    value={formData.functionId}
                    onChange={handleInputChange}
                    required
                    disabled={loadingData}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma função</option>
                    {functions.map(func => (
                      <option key={func.id} value={func.id}>
                        {func.name}
                      </option>
                    ))}
                  </select>
                  {formData.functionId && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja excluir esta função?')) {
                          try {
                            const token = localStorage.getItem('authToken');
                            await fetch(`/api/functions/${formData.functionId}`, { 
                              method: 'DELETE',
                              ...(token && { headers: { 'Authorization': `Bearer ${token}` } })
                            });
                            setFunctions(prev => prev.filter(f => f.id !== formData.functionId));
                            setFormData(prev => ({ ...prev, functionId: '' }));
                          } catch (error) {
                            console.error('Erro ao excluir função:', error);
                          }
                        }
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Departamento
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const name = prompt('Nome do novo departamento:');
                      if (name) {
                        try {
                          const token = localStorage.getItem('authToken');
                          const response = await fetch('/api/departments', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              ...(token && { 'Authorization': `Bearer ${token}` })
                            },
                            body: JSON.stringify({ name })
                          });
                          if (response.ok) {
                            const newDepartment = await response.json();
                            setDepartments(prev => [...prev, newDepartment]);
                            setFormData(prev => ({ ...prev, departmentId: newDepartment.id }));
                          }
                        } catch (error) {
                          console.error('Erro ao criar departamento:', error);
                        }
                      }
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 whitespace-nowrap"
                  >
                    + Novo Departamento
                  </button>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {formData.departmentId && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja excluir este departamento?')) {
                          try {
                            const token = localStorage.getItem('authToken');
                            const response = await fetch(`/api/departments?id=${formData.departmentId}`, {
                              method: 'DELETE',
                              ...(token && { headers: { 'Authorization': `Bearer ${token}` } })
                            });
                            if (response.ok) {
                              setDepartments(prev => prev.filter(d => d.id !== formData.departmentId));
                              setFormData(prev => ({ ...prev, departmentId: '' }));
                            }
                          } catch (error) {
                            console.error('Erro ao excluir departamento:', error);
                          }
                        }
                      }}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gerente Responsável *
                </label>
                <select
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleInputChange}
                  required
                  disabled={loadingData || userType === 'MANAGER'}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {userType !== 'MANAGER' && <option value="">Selecione um gerente</option>}
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horários de Trabalho */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Horário de Início *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Horário de Fim *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Dias de Trabalho */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Dias de Trabalho *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {weekDays.map(day => (
                  <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={day.value}
                      checked={formData.workDays.includes(day.value)}
                      onChange={handleInputChange}
                      className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">Atendente ativo</span>
              </label>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Adicionar Atendente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}