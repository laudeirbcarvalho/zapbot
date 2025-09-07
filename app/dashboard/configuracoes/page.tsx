"use client";

import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function ConfiguracoesPage() {
  const router = useRouter();
  
  const { isAdmin, userId, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    nomeEmpresa: "ZapBot Marketing",
    email: "contato@zapbot.com",
    telefone: "(11) 99999-0000",
    endereco: "Av. Paulista, 1000 - São Paulo, SP",
    webhookUrl: "https://zapbot.com/api/webhook",
    apiKey: "sk_test_123456789abcdef",
    tema: "escuro"
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Verificar autenticação usando localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Carregar configurações do servidor
  useEffect(() => {
    async function fetchSettings() {
      try {
        setDataLoading(true);
        const { authenticatedFetch } = await import('@/app/lib/api-client');
        const data = await authenticatedFetch('/api/settings');
        setFormData(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        setError('Falha ao carregar configurações. Por favor, tente novamente.');
      } finally {
        setDataLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const { authenticatedFetch } = await import('@/app/lib/api-client');
      const data = await authenticatedFetch('/api/settings', {
        method: 'PUT',
        body: formData,
      });
      
      setFormData(data);
      setError(null);
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError('Falha ao salvar configurações. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Header title="Configurações" />
      
      <div className="mt-6 max-w-4xl mx-auto">
        {dataLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Carregando configurações...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-md mb-6">
            {error}
            <button 
              onClick={() => window.location.reload()} 
              className="ml-4 underline hover:text-white"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Integrações</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">URL do Webhook</label>
                <input
                  type="text"
                  name="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Chave de API</label>
                <input
                  type="password"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleChange}
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
      )}
      </div>
    </div>
  );
}