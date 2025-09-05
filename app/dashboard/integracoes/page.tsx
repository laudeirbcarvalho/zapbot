'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Header from '../../components/Header';

interface Integration {
  id: string;
  name: string;
  type: string;
  config: string;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationConfig {
  icon?: string;
  description?: string;
  status?: string;
  url?: string;
  apiKey?: string;
  instanceName?: string;
}

export default function IntegracoesPage() {
  const { data: session, status } = useSession();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  
  // Estados para Evolution API
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [loadingQR, setLoadingQR] = useState(false);
  const [evolutionInstances, setEvolutionInstances] = useState<any[]>([]);

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



  // Função para conectar com Evolution API do cliente
  const connectToEvolution = async () => {
    if (!evolutionUrl.trim() || !evolutionApiKey.trim() || !phoneNumber.trim()) {
      alert('Por favor, preencha todos os campos: URL da Evolution API, API Key e número do WhatsApp');
      return;
    }

    try {
      setLoadingQR(true);
      
      // Conectar com a Evolution API do cliente
      const response = await fetch('/api/integrations/evolution/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          evolutionUrl: evolutionUrl.trim(),
          apiKey: evolutionApiKey.trim(),
          phoneNumber: phoneNumber.trim(),
          instanceName: instanceName.trim() || phoneNumber.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao conectar com Evolution API');
      }

      const data = await response.json();
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        alert('QR Code gerado com sucesso! Escaneie com seu WhatsApp.');
      } else {
        alert('Conexão estabelecida, mas QR Code não disponível. A instância pode já estar conectada.');
      }
      
    } catch (error) {
      console.error('Erro ao conectar com Evolution:', error);
      alert('Erro ao conectar com Evolution API. Verifique os dados e tente novamente.');
    } finally {
      setLoadingQR(false);
    }
  };

  // Função para gerar novo QR Code
  const generateNewQRCode = async () => {
    if (!evolutionUrl.trim() || !evolutionApiKey.trim() || !phoneNumber.trim()) {
      alert('Por favor, configure primeiro a conexão com a Evolution API');
      return;
    }

    try {
      setLoadingQR(true);
      const response = await fetch('/api/integrations/evolution/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          evolutionUrl: evolutionUrl.trim(),
          apiKey: evolutionApiKey.trim(),
          phoneNumber: phoneNumber.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar QR Code');
      }

      const data = await response.json();
      if (data.qrCode) {
        setQrCode(data.qrCode);
      } else {
        alert('QR Code não disponível. A instância pode já estar conectada.');
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert('Erro ao gerar QR Code. Tente novamente.');
    } finally {
      setLoadingQR(false);
    }
  };

  // Função para alternar status da integração
  const toggleIntegrationStatus = async (integrationId: string, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus ? 'connected' : 'disconnected' 
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status');
      }

      // Recarregar integrações
      const updatedResponse = await fetch('/api/integrations');
      const updatedData = await updatedResponse.json();
      setIntegrations(updatedData);
      
      alert(`Integração ${newStatus ? 'conectada' : 'desconectada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da integração');
    }
  };

  // Função para testar conexão Evolution
  const testEvolutionConnection = async () => {
    try {
      const response = await fetch('/api/integrations/evolution/test');
      
      if (!response.ok) {
        throw new Error('Falha ao testar conexão');
      }
      
      const data = await response.json();
      alert(`Conexão testada: ${data.success ? 'Sucesso' : 'Falha'}`);
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      alert('Erro ao testar conexão');
    }
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
        <div className="mt-6 space-y-6">
          
          {/* Seção Evolution API */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 flex justify-between items-center">
              <div className="flex items-center">
                <div className="text-2xl mr-4">📱</div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Evolution API</h3>
                  <p className="text-gray-400">Integração WhatsApp via QR Code</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={testEvolutionConnection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Testar Conexão
                </button>
                <button
                  onClick={() => setActiveIntegration(activeIntegration === 'evolution' ? null : 'evolution')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {activeIntegration === 'evolution' ? 'Fechar' : 'Configurar'}
                </button>
              </div>
            </div>
            
            {activeIntegration === 'evolution' && (
              <div className="p-6 border-t border-gray-700 bg-gray-850">
                <h4 className="text-lg font-medium text-white mb-4">Configuração WhatsApp</h4>
                
                {/* Configuração da Evolution API */}
                <div className="mb-6">
                  <h5 className="text-md font-medium text-white mb-2">Configuração da Evolution API:</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        URL da Evolution API
                      </label>
                      <input
                        type="url"
                        value={evolutionUrl}
                        onChange={(e) => setEvolutionUrl(e.target.value)}
                        placeholder="https://sua-evolution-api.com"
                        className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={evolutionApiKey}
                        onChange={(e) => setEvolutionApiKey(e.target.value)}
                        placeholder="Sua chave da API Evolution"
                        className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Número do WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="5511999999999 (com código do país)"
                        className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome da Instância (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Nome personalizado para a instância"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={connectToEvolution}
                        disabled={loadingQR}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50"
                      >
                        {loadingQR ? 'Conectando...' : 'Conectar WhatsApp'}
                      </button>
                      
                      {qrCode && (
                        <button
                          onClick={generateNewQRCode}
                          disabled={loadingQR}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                        >
                          Novo QR
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                      <h6 className="text-sm font-medium text-blue-300 mb-1">Como configurar:</h6>
                      <ul className="text-xs text-blue-200 space-y-1">
                        <li>• Insira a URL da sua Evolution API</li>
                        <li>• Cole sua chave de API (API Key)</li>
                        <li>• Digite o número do WhatsApp com código do país</li>
                        <li>• Clique em "Conectar WhatsApp" para gerar o QR Code</li>
                        <li>• Escaneie o QR Code com seu WhatsApp</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Lista de instâncias existentes */}
                <div className="mb-6">
                  <h5 className="text-md font-medium text-white mb-2">Instâncias Existentes:</h5>
                  {integrations
                    .filter(integration => integration.type === 'evolution-api')
                    .map((integration) => {
                      const config: IntegrationConfig = JSON.parse(integration.config);
                      return (
                        <div key={integration.id} className="bg-gray-700 p-3 rounded mb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{integration.name}</p>
                              <p className="text-gray-400 text-sm">Instância: {config.instanceName}</p>
                              <p className="text-gray-400 text-xs">Status: {config.status === 'connected' ? 'Conectado' : 'Desconectado'}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleIntegrationStatus(integration.id, config.status !== 'connected')}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  config.status === 'connected'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {config.status === 'connected' ? 'Desconectar' : 'Conectar'}
                              </button>
                              <button
                                onClick={() => config.instanceName && generateNewQRCode()}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                              >
                                Gerar QR Code
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
                
                {/* QR Code */}
                {qrCode && (
                  <div className="mt-4 text-center">
                    <h5 className="text-md font-medium text-white mb-2">QR Code para WhatsApp:</h5>
                    <div className="bg-white p-4 rounded inline-block">
                      <img src={qrCode} alt="QR Code WhatsApp" className="max-w-xs" />
                    </div>
                    <p className="text-gray-300 text-sm mt-2">
                      Escaneie este QR Code com seu WhatsApp para conectar
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={() => setQrCode(null)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        Fechar QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Integrações existentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.filter(integration => !['evolution-api'].includes(integration.type)).map((integration) => {
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
                      <h4 className="text-lg font-medium text-white mb-4">Configurações de {integration.name}</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                          </label>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleIntegrationStatus(integration.id, !config.status || config.status === "disconnected")}
                              className={`px-4 py-2 rounded font-medium ${
                                config.status === "connected"
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              }`}
                            >
                              {config.status === "connected" ? "Desconectar" : "Conectar"}
                            </button>
                            <span className="text-sm text-gray-300">
                              {config.status === "connected" ? "Conectado" : "Desconectado"}
                            </span>
                          </div>
                        </div>
                        
                        {config.url && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              URL
                            </label>
                            <p className="text-white bg-gray-700 p-2 rounded">{config.url}</p>
                          </div>
                        )}
                        
                        {config.apiKey && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              API Key
                            </label>
                            <p className="text-white bg-gray-700 p-2 rounded font-mono">
                              {config.apiKey.substring(0, 8)}...{config.apiKey.substring(config.apiKey.length - 4)}
                            </p>
                          </div>
                        )}
                        
                        {config.description && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Descrição
                            </label>
                            <p className="text-gray-300">{config.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}