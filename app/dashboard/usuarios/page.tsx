'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Header from "@/app/components/Header";
import HelpModal from "@/app/components/HelpModal";
import AddUserModal from '../../components/AddUserModal';
import EditUserModal from '../../components/EditUserModal';
import ViewUserModal from '../../components/ViewUserModal';
import { useAuth } from '../../hooks/useAuth';
import { getHelpData } from '../../data/helpData';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'ADMIN' | 'MANAGER';
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    managedAttendants: number;
    attendantLeads: number;
    managers: number;
    attendants: number;
    leads: number;
    attendances: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const helpData = getHelpData('usuarios');
  const { isAdmin, isSuperAdmin, userId, isLoading } = useAuth();

  const fetchUsers = async () => {
    try {
      setDataLoading(true);
      
      // Aguardar o carregamento da autenticação
      if (isLoading) {
        return;
      }
      
      // Verificar se o usuário está autenticado
      if (!userId) {
        console.error('Usuário não autenticado');
        router.push('/login');
        return;
      }
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token de autenticação não encontrado');
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(userTypeFilter && { userType: userTypeFilter }),
        ...(isActiveFilter && { isActive: isActiveFilter })
      });

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuarios');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchUsers();
    }
  }, [pagination.page, searchTerm, userTypeFilter, isActiveFilter, isLoading]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuario?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token de autenticação não encontrado');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir usuario');
      }

      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir usuario');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getUserTypeLabel = (userType: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) return 'Super Admin';
    return userType === 'ADMIN' ? 'Administrador' : 'Gerente';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  // Verificar autenticação usando localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Verificar autenticação e permissão de admin
  if (isLoading) {
    return (
      <div className="p-6">
        <Header title="Usuários" />
        <div className="mt-6 text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userId || !isAdmin) {
    return (
      <div className="p-6">
        <Header title="Usuários" />
        <div className="mt-6 text-center">
          <div className="bg-red-900 text-red-200 p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p>Apenas administradores podem acessar esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="p-6">
        <Header title="Usuários" />
        <div className="flex justify-center items-center h-64 mt-6">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Header title="Usuários" />
        <div className="bg-red-900 text-red-200 p-4 rounded-md mt-6">
          <strong>Erro:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Usuários" />
      <div className="space-y-6 mt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Lista de Usuários</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowHelpModal(true)}
              className="px-4 py-2 rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              title="Como usar este módulo"
            >
              <span>❓</span>
              Ajuda
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-md flex items-center gap-2 transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusIcon className="h-5 w-5" />
                Novo Usuário
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome ou email..."
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tipo de Usuário
              </label>
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="MANAGER">Gerente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Atendentes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.email}</div>
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isSuperAdmin
                      ? 'bg-red-100 text-red-800'
                      : user.userType === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getUserTypeLabel(user.userType, user.isSuperAdmin)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {getStatusLabel(user.isActive)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user._count?.attendants || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {user._count?.leads || 0}
                  </span>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(user.createdAt)}
                  </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleViewUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Visualizar"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {(isAdmin || user.id === userId) && (
                      <button
                        onClick={() => handleEditUser(user)}
                        className="transition-colors text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    {isAdmin && !user.isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="transition-colors text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Nenhum usuário encontrado.
            </div>
          )}
      </div>

        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchUsers();
            }}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              fetchUsers();
            }}
          />
        )}

        {showViewModal && selectedUser && (
          <ViewUserModal
            user={selectedUser}
            onClose={() => {
              setShowViewModal(false);
              setSelectedUser(null);
            }}
          />
        )}
        
        {/* Modal de Ajuda */}
        {showHelpModal && helpData && (
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
            moduleName={helpData.moduleName}
            steps={helpData.steps}
          />
        )}
      </div>
    </div>
  );
}