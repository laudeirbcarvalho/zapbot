'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, ShieldCheckIcon, XCircleIcon, CheckCircleIcon, UsersIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'ADMIN' | 'MANAGER';
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewUserModalProps {
  user: User;
  onClose: () => void;
}

export default function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  const [attendants, setAttendants] = useState<Array<{id: string, name: string, email: string, isActive: boolean}>>([]);
  const [loadingAttendants, setLoadingAttendants] = useState(true);

  useEffect(() => {
    const loadAttendants = async () => {
      if (user.userType === 'MANAGER') {
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`/api/attendants?managerId=${user.id}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });
          if (response.ok) {
            const data = await response.json();
            setAttendants(data.attendants || data);
          }
        } catch (error) {
          console.error('Erro ao carregar atendentes:', error);
        }
      }
      setLoadingAttendants(false);
    };

    loadAttendants();
  }, [user.id, user.userType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserTypeLabel = (userType: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) return 'Super Admin';
    return userType === 'ADMIN' ? 'Administrador' : 'Gerente';
  };

  const getUserTypeColor = (userType: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) return 'bg-red-100 text-red-800';
    return userType === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Detalhes do Gerente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {/* Informações básicas */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full mr-4">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.userType, user.isSuperAdmin)}`}>
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    {getUserTypeLabel(user.userType, user.isSuperAdmin)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? (
                      <><CheckCircleIcon className="h-3 w-3 mr-1" />Ativo</>
                    ) : (
                      <><XCircleIcon className="h-3 w-3 mr-1" />Inativo</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-300">{user.email}</span>
              </div>
              <div>
                <span className="text-sm text-gray-400">ID:</span>
                <span className="text-gray-300 ml-2 font-mono text-sm">{user.id}</span>
              </div>
              <div>
                <span className="text-sm text-gray-400">Criado em:</span>
                <span className="text-gray-300 ml-2">{formatDate(user.createdAt)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-400">Atualizado em:</span>
                <span className="text-gray-300 ml-2">{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Lista de Atendentes Gerenciados */}
          {user.userType === 'MANAGER' && (
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-600 p-3 rounded-full mr-4">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Atendentes Gerenciados</h3>
                  <p className="text-gray-400 text-sm">Lista de atendentes sob responsabilidade deste gerente</p>
                </div>
              </div>

              {loadingAttendants ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 mt-2">Carregando atendentes...</p>
                </div>
              ) : attendants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attendants.map(attendant => (
                    <div key={attendant.id} className="bg-gray-600 rounded-lg p-4 border border-gray-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{attendant.name}</h4>
                          <p className="text-gray-300 text-sm">{attendant.email}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attendant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {attendant.isActive ? (
                            <><CheckCircleIcon className="h-3 w-3 mr-1" />Ativo</>
                          ) : (
                            <><XCircleIcon className="h-3 w-3 mr-1" />Inativo</>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum atendente associado a este gerente</p>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="flex justify-end p-6 border-t border-gray-600 bg-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 border border-gray-500 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}