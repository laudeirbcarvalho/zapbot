"use client";

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface Integration {
  id: string;
  name: string;
  type: string;
  config: string;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationConfig {
  status: string;
  icon: string;
  description?: string;
}

export default function IntegracoesPage() {
  const { data: session, status } = useSession();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  // Redireciona para login se não estiver autenticado
  if (status === "unauthenticated") {
    redirect("/login");
  }

  // Carregar integrações do banco de dados
  useEffect(() => {
    async function fetchIntegrations() {
      try {
        setLoading(true);
        const response = await fetch('/api/integrations');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar integrações');
        }
        
        const data = await response.json();
        setIntegrations(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar integrações:', err);
        setError('Falha ao carregar integrações. Por favor, tente novamente.');
        setIntegrations([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchIntegrations();
  }, []);

  const toggleIntegration = (id: string) => {
    // Atualizar status da integração no banco de dados
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;
    
    const config: IntegrationConfig = JSON.parse(integration.config);
    const newStatus = config.status === "connected" ? "disconnected" : "connected";
    const newConfig = { ...config, status: newStatus };
    
    fetch(`/api/integrations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: JSON.stringify(newConfig),
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao atualizar integração');
        return response.json();
      })
      .then(data => {
        setIntegrations(
          integrations.map((integration) => {
            if (integration.id === id) {
              return { ...integration, config: JSON.stringify(newConfig) };
            }
            return integration;
          })
        );
      })
      .catch(error => {
        console.error('Erro ao atualizar integração:', error);
        alert('Erro ao atualizar integração. Por favor, tente novamente.');
      });
  };

  const getWebhookUrl = () => {
    // Na produção, isso seria a URL real do seu site
    return `${window.location.origin}/api/webhook/n8n`;
  };

  return (
    <>
      <Header title="Integrações" />
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Carregando integrações...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-md m-6">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-4 underline hover:text-white"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => {
            const config: IntegrationConfig = JSON.parse(integration.config);
            return (
              <div
                key={integration.id}
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
              <div className="p-6 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="text-2xl mr-4">{config.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{integration.name}</h3>
                    <p className="text-gray-400">{integration.type}</p>
                    {config.description && (
                      <p className="text-xs text-gray-300 mt-1">
                        {config.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      config.status === "connected" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span className="text-sm text-gray-300">
                    {config.status === "connected" ? "Conectado" : "Desconectado"}
                  </span>
                  <button
                    onClick={() => setActiveIntegration(integration.id === activeIntegration ? null : integration.id)}
                    className="ml-4 text-blue-400 hover:text-blue-300"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            
            {activeIntegration === integration.id && (
              <div className="p-6 border-t border-gray-700 bg-gray-850">
                {integration.id === "n8n" && (
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Configuração do n8n</h4>
                    <p className="text-gray-300 mb-4">
                      Para integrar com o n8n, use o seguinte webhook URL no seu workflow:
                    </p>
                    <div className="bg-gray-700 p-3 rounded mb-4 font-mono text-sm text-white overflow-x-auto">
                      {getWebhookUrl()}
                    </div>
                    <p className="text-gray-300 mb-4">
                      Envie dados no formato JSON com pelo menos o campo "name" obrigatório:
                    </p>
                    <pre className="bg-gray-700 p-3 rounded mb-4 font-mono text-sm text-white overflow-x-auto">
{`{
  "name": "Nome do Lead",
  "email": "email@exemplo.com",
  "phone": "(00) 00000-0000",
  "source": "Origem do Lead",
  "notes": "Observações adicionais"
}`}
                    </pre>
                    <button
                      onClick={() => toggleIntegration("n8n")}
                      className={`px-4 py-2 rounded font-medium ${
                        JSON.parse(integration.config).status === "connected"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {JSON.parse(integration.config).status === "connected" ? "Desconectar" : "Conectar"}
                    </button>
                  </div>
                )}
                
                {integration.id === "google" && (
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Configuração do Google</h4>
                    <p className="text-gray-300 mb-4">
                      Configure a integração com o Google para sincronizar contatos e calendário.
                    </p>
                    <button
                      onClick={() => toggleIntegration("google")}
                      className={`px-4 py-2 rounded font-medium ${
                        JSON.parse(integration.config).status === "connected"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {JSON.parse(integration.config).status === "connected" ? "Desconectar" : "Conectar com Google"}
                    </button>
                  </div>
                )}
                
                {integration.id === "evolution" && (
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Configuração da Evolution API</h4>
                    <p className="text-gray-300 mb-4">
                      Configure a integração com a Evolution API para WhatsApp.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-300 mb-2">URL da API</label>
                        <input
                          type="text"
                          className="w-full p-2 bg-gray-700 text-white rounded"
                          placeholder="https://sua-api.exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">API Key</label>
                        <input
                          type="password"
                          className="w-full p-2 bg-gray-700 text-white rounded"
                          placeholder="Sua API Key"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleIntegration("evolution")}
                      className={`px-4 py-2 rounded font-medium ${
                        JSON.parse(integration.config).status === "connected"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {JSON.parse(integration.config).status === "connected" ? "Desconectar" : "Conectar"}
                    </button>
                  </div>
                )}
                
                {integration.id === "chatwoot" && (
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Configuração do Chatwoot</h4>
                    <p className="text-gray-300 mb-4">
                      Configure a integração com o Chatwoot para atendimento ao cliente.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-300 mb-2">URL do Chatwoot</label>
                        <input
                          type="text"
                          className="w-full p-2 bg-gray-700 text-white rounded"
                          placeholder="https://chatwoot.exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2">API Key</label>
                        <input
                          type="password"
                          className="w-full p-2 bg-gray-700 text-white rounded"
                          placeholder="Sua API Key"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleIntegration("chatwoot")}
                      className={`px-4 py-2 rounded font-medium ${
                        JSON.parse(integration.config).status === "connected"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {JSON.parse(integration.config).status === "connected" ? "Desconectar" : "Conectar"}
                    </button>
                  </div>
                )}
              </div>
            )}</div>
            );
          })}
        </div>
      )}
    </>
  );
}