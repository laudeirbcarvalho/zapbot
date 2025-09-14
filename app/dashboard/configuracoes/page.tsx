"use client";

import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import HelpModal from "@/app/components/HelpModal";
import { getHelpData } from '@/app/data/helpData';
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../contexts/SettingsContext";

export default function ConfiguracoesPage() {
  const router = useRouter();
  
  const { isAdmin, userId, isLoading } = useAuth();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();

  const [formData, setFormData] = useState({
    nomeEmpresa: "",
    email: "",
    telefone: "",
    url: "",
    tema: "escuro" as "claro" | "escuro"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const helpData = getHelpData('configuracoes');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);



  // Verificar autenticação usando localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Carregar configurações do contexto
  useEffect(() => {
    if (!settingsLoading) {
      setFormData({
        nomeEmpresa: settings.nomeEmpresa,
        email: settings.email,
        telefone: settings.telefone,
        url: settings.url,
        tema: settings.tema
      });
    }
  }, [settings, settingsLoading]);

  // Limpar mensagem de sucesso após 3 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Verificar autenticação e permissão de admin
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userId || !isAdmin) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Atualizar configurações no contexto
      updateSettings({
        nomeEmpresa: formData.nomeEmpresa,
        email: formData.email,
        telefone: formData.telefone,
        url: formData.url,
        tema: formData.tema
      });
      
      setSuccessMessage('Configurações salvas com sucesso!');
    } catch (error) {
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Header title="Configurações" />
      
      {/* Seção de título com botão de ajuda */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
          <p className="text-gray-400 mt-1">Gerencie as configurações gerais da empresa e integrações</p>
        </div>
        <button
          onClick={() => setShowHelpModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          title="Ajuda sobre Configurações"
        >
          <span className="text-lg">❓</span>
          Ajuda
        </button>
      </div>
      
      <div className="mt-6 max-w-4xl mx-auto">
        {settingsLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Carregando configurações...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-md mb-6">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-900/30 border border-green-500 text-green-200 p-4 rounded-md mb-6">
                {successMessage}
              </div>
            )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Informações da Empresa</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  name="nomeEmpresa"
                  value={formData.nomeEmpresa}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">URL/Website</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://exemplo.com"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Aparência</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tema"
                    value="claro"
                    checked={formData.tema === "claro"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-gray-300">Claro</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tema"
                    value="escuro"
                    checked={formData.tema === "escuro"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700"
                  />
                  <span className="ml-2 text-gray-300">Escuro</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-md font-medium flex items-center transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Salvando...
                </>
              ) : "Salvar Configurações"}
            </button>
          </div>
        </form>
          </>
        )}
      </div>
      
      {/* Modal de Ajuda */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        moduleName={helpData.moduleName}
        steps={helpData.steps}
      />
    </div>
  );
}