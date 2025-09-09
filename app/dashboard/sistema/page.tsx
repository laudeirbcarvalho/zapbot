"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { useAuth } from "../../hooks/useAuth";
import { useTenant } from "../../hooks/useTenant";
import AddAdminModal from '@/app/components/AddAdminModal';
import EditAdminModal from '@/app/components/EditAdminModal';

interface Administrador {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  email?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    settings: number;
  };
}

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description?: string;
}

export default function SistemaPage() {
  const router = useRouter();
  const { isAdmin, userId, isLoading, isSuperAdmin } = useAuth();
  const { tenant, settings, updateSettings } = useTenant();
  
  const [activeTab, setActiveTab] = useState('administradores');
  const [administradores, setAdministradores] = useState<Administrador[]>([]);

  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Formulários
  
  const [smtpForm, setSmtpForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: ''
  });
  
  const [newAdministradorForm, setNewAdministradorForm] = useState({
    name: '',
    slug: '',
    domain: '',
    email: '',
    password: '',
    logo: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const [showNewAdministradorForm, setShowNewAdministradorForm] = useState(false);
  const [showEditAdministradorForm, setShowEditAdministradorForm] = useState(false);
  const [editingAdministrador, setEditingAdministrador] = useState<Administrador | null>(null);
  

  const [editAdministradorForm, setEditAdministradorForm] = useState({
    name: '',
    slug: '',
    domain: '',
    email: '',
    password: '',
    logo: ''
  });
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string>('');

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Carregar dados
  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);
  


  const loadData = async () => {
    try {
      setLoading(true);
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      // Carregar administradores
      const administradoresData = await authenticatedFetch('/api/admin/tenants');
      setAdministradores(administradoresData.tenants);
      
      // Carregar usuários do sistema
      const usersData = await authenticatedFetch('/api/users');
      console.log('Usuários carregados:', usersData);
      
      // Carregar configurações do sistema
      const settingsData = await authenticatedFetch('/api/tenant/settings');
      setSystemSettings(settingsData.settings);
      
      // Preencher formulários
      const settingsMap = settingsData.settings.reduce((acc: any, setting: SystemSetting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      

      
      setSmtpForm({
        smtp_host: settingsMap.smtp_host || '',
        smtp_port: settingsMap.smtp_port || '587',
        smtp_user: settingsMap.smtp_user || '',
        smtp_password: settingsMap.smtp_password || '',
        smtp_from_email: settingsMap.smtp_from_email || '',
        smtp_from_name: settingsMap.smtp_from_name || ''
      });
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };



  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(smtpForm);
      setSuccess('Configurações SMTP salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erro ao salvar configurações SMTP');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await fetch('/api/upload/logo', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro no upload da logo');
    }
    
    const data = await response.json();
    return data.url;
  };

  // Função para lidar com mudança de logo do sistema


  const handleCreateAdministrador = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      let logoUrl = '';
      
      // Upload da logo se foi selecionada
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }
      
      await authenticatedFetch('/api/admin/tenants', {
        method: 'POST',
        body: {
          ...newAdministradorForm,
          logo: logoUrl
        }
      });
      
      setSuccess('Administrador criado com sucesso!');
      setNewAdministradorForm({ name: '', slug: '', domain: '', email: '', password: '', logo: '' });
      setLogoFile(null);
      setLogoPreview('');
      setShowNewAdministradorForm(false);
      loadData(); // Recarregar lista
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erro ao criar administrador');
    } finally {
      setSaving(false);
    }
  };



  const handleEditAdministrador = (administrador: Administrador) => {
    setEditingAdministrador(administrador);
    setEditAdministradorForm({
      name: administrador.name,
      slug: administrador.slug,
      domain: administrador.domain || '',
      email: administrador.email || '',
      password: '',
      logo: administrador.logo || ''
    });
    setEditLogoFile(null);
    setEditLogoPreview('');
    setShowEditAdministradorForm(true);
  };

  const handleUpdateAdministrador = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAdministrador) return;
    
    try {
      setSaving(true);
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      let logoUrl = editAdministradorForm.logo;
      
      // Upload da nova logo se foi selecionada
      if (editLogoFile) {
        logoUrl = await uploadLogo(editLogoFile);
      }
      
      await authenticatedFetch(`/api/admin/tenants/${editingAdministrador.id}`, {
        method: 'PUT',
        body: {
          ...editAdministradorForm,
          logo: logoUrl
        }
      });
      
      setSuccess('Administrador atualizado com sucesso!');
      setEditAdministradorForm({
        name: '',
        slug: '',
        domain: '',
        email: '',
        password: '',
        logo: ''
      });
      setEditLogoFile(null);
      setEditLogoPreview('');
      setShowEditAdministradorForm(false);
      setEditingAdministrador(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Erro ao atualizar administrador:', error);
      setError('Erro ao atualizar administrador');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdministrador = async (id: string, name: string, isSuperAdmin?: boolean) => {
    // Proteger SuperAdmin de ser deletado
    if (isSuperAdmin) {
      setError('O SuperAdmin não pode ser excluído!');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir o administrador "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      
      await authenticatedFetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE'
      });
      
      setSuccess('Administrador excluído com sucesso!');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Erro ao excluir administrador:', error);
      setError('Erro ao excluir administrador');
    }
  };

  // Verificar permissões
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userId || !isSuperAdmin) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Apenas Super Administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Configurações do Sistema" />
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Configurações do Sistema" />
      
      {/* Mensagens */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-md mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline hover:text-white">
            Fechar
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/30 border border-green-500 text-green-200 p-4 rounded-md mb-6">
          {success}
        </div>
      )}
      
      {/* Tabs */}
      <div className="mt-6 max-w-6xl mx-auto">
        <div className="border-b border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'administradores', label: 'Gerenciar Administradores' },
              { id: 'smtp', label: 'Configurações SMTP' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Conteúdo das Tabs */}
        {activeTab === 'smtp' && (
          <form onSubmit={handleSaveSmtp} className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                Configurações SMTP para Envio de E-mails
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Servidor SMTP
                  </label>
                  <input
                    type="text"
                    value={smtpForm.smtp_host}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_host: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Porta SMTP
                  </label>
                  <input
                    type="number"
                    value={smtpForm.smtp_port}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_port: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Usuário SMTP
                  </label>
                  <input
                    type="text"
                    value={smtpForm.smtp_user}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_user: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@gmail.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Senha SMTP
                  </label>
                  <input
                    type="password"
                    value={smtpForm.smtp_password}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_password: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    E-mail Remetente
                  </label>
                  <input
                    type="email"
                    value={smtpForm.smtp_from_email}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_from_email: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="noreply@exemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome do Remetente
                  </label>
                  <input
                    type="text"
                    value={smtpForm.smtp_from_name}
                    onChange={(e) => setSmtpForm(prev => ({ ...prev, smtp_from_name: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CRM Sistema"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-md font-medium flex items-center transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Salvando...
                  </>
                ) : "Salvar Configurações SMTP"}
              </button>
            </div>
          </form>
        )}
        

        
        {activeTab === 'administradores' && (
          <div className="space-y-6">
            {/* Botão para criar novo administrador */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gerenciar Administradores</h2>
              <button
                onClick={() => setShowNewAdministradorForm(!showNewAdministradorForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {showNewAdministradorForm ? 'Cancelar' : 'Novo Administrador'}
              </button>
            </div>
            
            {/* Formulário para novo administrador */}
            {showNewAdministradorForm && (
              <form onSubmit={handleCreateAdministrador} className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Criar Novo Administrador</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdministradorForm.name}
                      onChange={(e) => setNewAdministradorForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: CRM"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Slug * (para URL)
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdministradorForm.slug}
                      onChange={(e) => setNewAdministradorForm(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="crm"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      URL: /login/{newAdministradorForm.slug}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdministradorForm.email}
                      onChange={(e) => setNewAdministradorForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin@crm.com.br"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={newAdministradorForm.password}
                      onChange={(e) => setNewAdministradorForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senha do administrador"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Domínio (opcional)
                    </label>
                    <input
                      type="text"
                      value={newAdministradorForm.domain}
                      onChange={(e) => setNewAdministradorForm(prev => ({ ...prev, domain: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="crm.com.br"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Logo (opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                      onChange={handleLogoChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {logoPreview && (
                      <div className="mt-2">
                        <img src={logoPreview} alt="Preview" className="h-16 w-16 object-contain rounded" />
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      Formatos aceitos: JPG, JPEG, PNG, SVG (máx. 5MB)
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-md font-medium flex items-center transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Criando...
                      </>
                    ) : "Criar Administrador"}
                  </button>
                </div>
              </form>
            )}
            
            {/* Formulário de edição de administrador */}
            {showEditAdministradorForm && (
              <form onSubmit={handleUpdateAdministrador} className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Editar Administrador</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditAdministradorForm(false);
                      setEditingAdministrador(null);
                    }}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nome do CRM *
                    </label>
                    <input
                      type="text"
                      required
                      value={editAdministradorForm.name}
                      onChange={(e) => setEditAdministradorForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: CRM"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Slug * (para URL)
                    </label>
                    <input
                      type="text"
                      required
                      value={editAdministradorForm.slug}
                      onChange={(e) => setEditAdministradorForm(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="crm"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      URL: /login/{editAdministradorForm.slug}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={editAdministradorForm.email}
                      onChange={(e) => setEditAdministradorForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin@crm.com.br"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nova Senha (deixe em branco para manter a atual)
                    </label>
                    <input
                      type="password"
                      value={editAdministradorForm.password}
                      onChange={(e) => setEditAdministradorForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nova senha"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Domínio (opcional)
                    </label>
                    <input
                      type="text"
                      value={editAdministradorForm.domain}
                      onChange={(e) => setEditAdministradorForm(prev => ({ ...prev, domain: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="crm.com.br"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Logo (opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                      onChange={handleEditLogoChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {editLogoPreview && (
                      <div className="mt-2">
                        <img src={editLogoPreview} alt="Preview" className="h-16 w-16 object-contain rounded" />
                      </div>
                    )}
                    {editAdministradorForm.logo && !editLogoPreview && (
                      <div className="mt-2">
                        <img src={editAdministradorForm.logo} alt="Logo atual" className="h-16 w-16 object-contain rounded" />
                        <p className="text-sm text-gray-400">Logo atual</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      Formatos aceitos: JPG, JPEG, PNG, SVG (máx. 5MB)
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-md font-medium flex items-center transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Atualizando...
                      </>
                    ) : "Atualizar Administrador"}
                  </button>
                </div>
              </form>
            )}
            
            {/* Lista de administradores */}
            <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Administradores Existentes</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Domínio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Usuários
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Gerentes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Atendentes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {administradores.map((administrador) => (
                      <tr key={administrador.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                          {administrador.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            administrador.isSuperAdmin 
                              ? 'bg-purple-900 text-purple-200' 
                              : 'bg-blue-900 text-blue-200'
                          }`}>
                            {administrador.isSuperAdmin ? 'SuperAdmin' : 'Administrador'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <code className="bg-gray-600 px-2 py-1 rounded text-xs">
                            /login/{administrador.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {administrador.domain ? (
                            <code className="bg-gray-600 px-2 py-1 rounded text-xs">
                              {administrador.domain}
                            </code>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {administrador._count.users}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {administrador.users?.filter(u => u.userType === 'MANAGER').length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                           {administrador.users?.reduce((total, manager) => total + (manager.managedAttendants?.length || 0), 0) || 0}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                           {administrador.users?.reduce((total, manager) => 
                             total + (manager.managedAttendants?.reduce((subTotal, attendant) => 
                               subTotal + (attendant._count?.leads || 0), 0) || 0), 0) || 0}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            administrador.isActive 
                              ? 'bg-green-900 text-green-200' 
                              : 'bg-red-900 text-red-200'
                          }`}>
                            {administrador.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(administrador.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditAdministrador(administrador)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAdministrador(administrador.id, administrador.name, administrador.isSuperAdmin)}
                              className={`transition-colors ${
                                administrador.isSuperAdmin 
                                  ? 'text-gray-500 cursor-not-allowed' 
                                  : 'text-red-400 hover:text-red-300'
                              }`}
                              title={administrador.isSuperAdmin ? 'SuperAdmin não pode ser excluído' : 'Excluir'}
                              disabled={administrador.isSuperAdmin}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}