'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface EvolutionIntegrationProps {
  integration: any;
  isAdmin: boolean;
  onToggle: () => void;
}

interface WhatsAppInstance {
  id: string;
  instanceName: string;
  instanceId?: string;
  apiUrl: string;
  apiKey: string;
  phoneNumber?: string;
  channel: 'BAILEYS' | 'WHATSAPP_CLOUD_API' | 'EVOLUTION';
  token?: string;
  status: string;
  qrCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  isConfigured: boolean;
}

export default function EvolutionIntegration({ integration, isAdmin, onToggle }: EvolutionIntegrationProps) {
  // Estados para configuração da API Evolution
  const [evolutionConfig, setEvolutionConfig] = useState<EvolutionConfig>({
    apiUrl: '',
    apiKey: '',
    isConfigured: false
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  // Estados para formulário de instâncias
  const [instanceForm, setInstanceForm] = useState({
    instanceName: '',
    channel: 'BAILEYS' as 'BAILEYS' | 'WHATSAPP_CLOUD_API' | 'EVOLUTION',
    token: '',
    phoneNumber: ''
  });
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [instanceLoading, setInstanceLoading] = useState(false);
  const [instanceError, setInstanceError] = useState('');
  const [instanceSuccess, setInstanceSuccess] = useState('');

  // Estados para QR codes e outras funcionalidades
  const [qrCode, setQrCode] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [instanceQrCodes, setInstanceQrCodes] = useState<{[key: string]: string}>({});
  const [instanceLoadings, setInstanceLoadings] = useState<{[key: string]: boolean}>({});
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [qrCodeError, setQrCodeError] = useState('');
  const [qrCodeSuccess, setQrCodeSuccess] = useState('');
  // statusCheckInterval removido - agora usa verificação periódica automática
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCodeExpired, setQrCodeExpired] = useState(false);
  const [errorType, setErrorType] = useState<'network' | 'api' | 'config' | 'timeout' | null>(null);
  
  // Estados para instâncias da Evolution API
  const [evolutionInstances, setEvolutionInstances] = useState<any[]>([]);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [showEvolutionInstances, setShowEvolutionInstances] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<{[key: string]: boolean}>({});

  // Função para testar a configuração da API Evolution
  const testEvolutionConfig = async () => {
    setConfigLoading(true);
    setConfigError('');
    setConfigSuccess('');

    // Validar campos obrigatórios
    if (!evolutionConfig.apiUrl.trim()) {
      setConfigError('Por favor, insira a URL da API Evolution');
      setConfigLoading(false);
      return;
    }

    if (!evolutionConfig.apiKey.trim()) {
      setConfigError('Por favor, insira a API Key');
      setConfigLoading(false);
      return;
    }

    // Validar formato da URL
    try {
      new URL(evolutionConfig.apiUrl);
    } catch {
      setConfigError('URL inválida. Use o formato: https://sua-api.com');
      setConfigLoading(false);
      return;
    }

    try {
      // Testar conexão com a API Evolution
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(`${evolutionConfig.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConfigSuccess('Conexão com a API Evolution estabelecida com sucesso!');
        setEvolutionConfig(prev => ({ ...prev, isConfigured: true }));
        // Salvar configuração no localStorage
        localStorage.setItem('evolutionConfig', JSON.stringify({
          ...evolutionConfig,
          isConfigured: true
        }));
        loadInstances();
      } else if (response.status === 401) {
        setConfigError('API Key inválida. Verifique suas credenciais.');
      } else if (response.status === 404) {
        setConfigError('Endpoint não encontrado. Verifique a URL da API.');
      } else if (response.status >= 500) {
        setConfigError('Erro no servidor da API Evolution. Tente novamente mais tarde.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setConfigError(errorData.message || `Erro HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao testar configuração:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setConfigError('Timeout na conexão. Verifique se a URL está correta e acessível.');
        } else if (error.message.includes('fetch')) {
          setConfigError('Erro de rede. Verifique sua conexão e se a URL está acessível.');
        } else {
          setConfigError(`Erro: ${error.message}`);
        }
      } else {
        setConfigError('Erro desconhecido ao conectar com a API Evolution.');
      }
      
      setEvolutionConfig(prev => ({ ...prev, isConfigured: false }));
    } finally {
      setConfigLoading(false);
    }
  };

  // Função removida - duplicação corrigida

  // Função removida - agora usa verificação periódica automática

  // Funções de verificação de status removidas - agora usa verificação periódica automática

  // Função para salvar configuração da API Evolution
  const saveEvolutionConfig = async () => {
    await testEvolutionConfig();
  };

  // Função para verificar status real na Evolution API
  const checkInstanceStatus = async (instance: WhatsAppInstance) => {
    if (!evolutionConfig.isConfigured || !instance.instanceName) {
      return instance.status;
    }

    try {
      // IMPORTANTE: Usar instanceName nos endpoints da Evolution API
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/connectionState/${encodeURIComponent(instance.instanceName)}`, {
        headers: {
          'apikey': evolutionConfig.apiKey
        }
      });

      if (response.ok) {
        const statusData = await response.json().catch(() => ({ instance: { state: 'unknown' } }));
        const evolutionStatus = statusData.instance?.state;
        
        // Mapear status da Evolution para status do CRM
        let crmStatus = instance.status;
        if (evolutionStatus === 'open') {
          crmStatus = 'connected';
        } else if (evolutionStatus === 'connecting') {
          crmStatus = 'qr_code';
        } else if (evolutionStatus === 'close') {
          crmStatus = 'close';
        }
        
        // Atualizar no banco se o status mudou
        if (crmStatus !== instance.status) {
          const token = localStorage.getItem('authToken');
          await fetch('/api/whatsapp-instances', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              id: instance.id,
              status: crmStatus,
              phoneNumber: statusData.instance?.profilePictureUrl ? statusData.instance.profileName : instance.phoneNumber
            })
          });
        }
        
        return crmStatus;
      } else if (response.status === 404) {
        // Instância não existe na Evolution API - marcar como inativa
        console.warn(`⚠️ Instância ${instance.instanceName} não encontrada na Evolution API (404)`);
        
        const token = localStorage.getItem('authToken');
        await fetch('/api/whatsapp-instances', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: instance.id,
            status: 'disconnected',
            isActive: false
          })
        });
        
        return 'disconnected';
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status da instância:', error);
    }
    
    return instance.status;
  };

  const loadInstances = async () => {
    try {
      console.log('🔄 Carregando instâncias do banco de dados...');
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');
      
      const response = await fetch('/api/whatsapp-instances', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      console.log('📡 Resposta da API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json().catch(() => ({ instances: [] }));
        console.log('📊 Dados recebidos:', data);
        const instancesList = Array.isArray(data) ? data : (data.instances || []);
        console.log('📋 Instâncias encontradas:', instancesList.length);
        
        // Verificar status real de cada instância na Evolution API
        const updatedInstances = await Promise.all(
          instancesList.map(async (instance: WhatsAppInstance) => {
            const realStatus = await checkInstanceStatus(instance);
            return { ...instance, status: realStatus };
          })
        );
        
        setInstances(updatedInstances);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('❌ Erro na API:', errorData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar instâncias:', error);
    }
  };

  // Função para buscar instâncias da Evolution API
  const loadEvolutionInstances = async () => {
    if (!evolutionConfig.isConfigured) {
      setInstanceError('Configure a API Evolution primeiro');
      return;
    }

    setEvolutionLoading(true);
    try {
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({ instances: [] }));
        console.log('📊 Instâncias Evolution (raw):', data);
        
        // Processar diferentes formatos de resposta da Evolution API
        let processedInstances = [];
        if (Array.isArray(data)) {
          processedInstances = data;
        } else if (data && typeof data === 'object') {
          // Se a resposta é um objeto, pode ter as instâncias em uma propriedade
          processedInstances = data.instances || data.data || [data];
        }
        
        console.log('📊 Instâncias Evolution (processadas):', processedInstances);
        setEvolutionInstances(processedInstances);
      } else {
        console.error('Erro ao buscar instâncias da Evolution');
      }
    } catch (error) {
      console.error('Erro ao conectar com Evolution API:', error);
    } finally {
      setEvolutionLoading(false);
    }
  };

  // Função para encontrar correspondência entre instâncias
  const findEvolutionMatch = (crmInstance: WhatsAppInstance) => {
    return evolutionInstances.find(evInstance => {
      const instanceData = evInstance.instance || evInstance;
      const instanceName = instanceData?.instanceName || instanceData?.name || instanceData?.instance_name;
      const instanceId = instanceData?.instanceId || instanceData?.id || instanceData?.instance_id;
      const phoneNumber = instanceData?.phoneNumber || instanceData?.phone || instanceData?.number;
      
      return instanceName === crmInstance.instanceName ||
             instanceId === crmInstance.instanceId ||
             (phoneNumber && phoneNumber === crmInstance.phoneNumber);
    });
  };

  const createInstance = async () => {
    if (!evolutionConfig.isConfigured) {
      setInstanceError('Por favor, configure e teste a conexão com a API Evolution primeiro');
      return;
    }

    if (!instanceForm.instanceName.trim()) {
      setInstanceError('Por favor, insira um nome para a instância');
      return;
    }

    if (!instanceForm.phoneNumber.trim()) {
      setInstanceError('Por favor, insira o número de telefone');
      return;
    }

    setInstanceLoading(true);
    setInstanceError('');
    setInstanceSuccess('');

    try {
      console.log('🔄 Criando instância:', instanceForm.instanceName);
      
      // Timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let response;
      let uniqueInstanceName = instanceForm.instanceName;
      let attempt = 0;

      // Gerar nome único se necessário
      while (attempt < 5) {
        try {
          const instanceData = {
            instanceName: uniqueInstanceName,
            token: instanceForm.token || `token_${uniqueInstanceName}_${Date.now()}`,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS'
          };

          response = await fetch(`${evolutionConfig.apiUrl}/instance/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionConfig.apiKey
            },
            body: JSON.stringify(instanceData),
            signal: controller.signal
          });

          if (response.ok) {
            break; // Sucesso, sair do loop
          } else if (response.status === 409) {
            // Nome já existe, tentar com timestamp
            attempt++;
            uniqueInstanceName = `${instanceForm.instanceName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            await new Promise(resolve => setTimeout(resolve, 100)); // Pequena pausa
            continue;
          } else {
            // Outro erro, não tentar novamente
            break;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error; // Re-throw timeout errors
          }
          break;
        }
      }

      clearTimeout(timeoutId);

      // Gerar token se necessário
      const finalToken = instanceForm.token || `token_${uniqueInstanceName}_${Date.now()}`;

      if (response && response.ok) {
        const data = await response.json().catch(() => ({ instance: null }));
        console.log('✅ Instância criada na Evolution API:', data);
        
        // Extrair o instanceId real da Evolution API
        const evolutionInstanceId = data.instance?.instanceId || data.instanceId || data.id || uniqueInstanceName;
        console.log('🆔 ID da instância Evolution:', evolutionInstanceId);
        
        // Criar instância diretamente no banco de dados com status 'created'
        const instanceData = {
          instanceName: uniqueInstanceName,
          instanceId: evolutionInstanceId,
          apiUrl: evolutionConfig.apiUrl,
          apiKey: evolutionConfig.apiKey,
          phoneNumber: instanceForm.phoneNumber,
          channel: instanceForm.channel,
          token: finalToken,
          status: 'created'
        };
        
        try {
          const saveResponse = await fetch('/api/whatsapp-instances', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(instanceData)
          });
          
          if (saveResponse.ok) {
            const savedInstance = await saveResponse.json();
            console.log('✅ Instância salva no banco:', savedInstance);
            
            setInstanceSuccess(`✅ Instância '${uniqueInstanceName}' criada com sucesso! Agora você pode gerar o QR Code para conectar.`);
            
            // Limpar formulário
            setInstanceForm({
              instanceName: '',
              channel: 'BAILEYS',
              phoneNumber: '',
              token: ''
            });
            
            // Recarregar lista de instâncias
            loadInstances();
            
            // Aguardar um pouco e sugerir gerar QR Code
            setTimeout(() => {
              setInstanceSuccess(prev => prev + ' 📱 Clique em "Gerar QR Code" para conectar seu WhatsApp.');
            }, 2000);
            
          } else {
            const errorData = await saveResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(`Erro ao salvar no banco: ${errorData.error || saveResponse.statusText}`);
          }
        } catch (saveError) {
          console.error('❌ Erro ao salvar instância no banco:', saveError);
          setInstanceError(`Instância criada na Evolution API, mas erro ao salvar localmente: ${saveError.message}`);
        }
        
      } else {
        const errorData = await response?.json().catch(() => ({ message: 'Erro desconhecido' }));
        let errorMessage = errorData?.message || `Erro HTTP ${response?.status}: ${response?.statusText}`;
        
        if (response?.status === 401 || response?.status === 403) {
          errorMessage = '🔑 Erro de autenticação: Verifique sua API Key';
        } else if (response?.status === 409) {
          errorMessage = '⚠️ Não foi possível criar instância com nome único após várias tentativas';
        } else if (response?.status >= 500) {
          errorMessage = '🔧 Erro no servidor da Evolution API: Tente novamente em alguns minutos';
        }
        
        setInstanceError(errorMessage);
        console.error('❌ Erro da Evolution API:', errorData);
      }
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setInstanceError('⏱️ Timeout na conexão: A API demorou muito para responder');
        } else if (error.message.includes('fetch')) {
          setInstanceError('🌐 Erro de conexão: Verifique se a URL da API está correta e acessível');
        } else {
          setInstanceError(`❌ Erro: ${error.message}`);
        }
      } else {
        setInstanceError('❌ Erro inesperado: Tente novamente ou verifique sua conexão');
      }
    } finally {
      setInstanceLoading(false);
    }
  };

  const getQRCode = async () => {
    if (!instanceForm.instanceName.trim()) {
      setQrCodeError('Por favor, insira um nome para a instância');
      return;
    }

    if (!evolutionConfig.isConfigured) {
      setQrCodeError('Configure e teste a conexão com a API Evolution primeiro');
      return;
    }

    setQrCodeLoading(true);
    setQrCodeError('');
    setQrCodeSuccess('');
    setErrorType(null);

    try {
      console.log('🔄 Gerando QR Code para:', instanceForm.instanceName);
      
      // Timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
      
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/connect/${encodeURIComponent(instanceForm.instanceName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => ({ qrcode: null }));
        console.log('📱 Resposta da Evolution API:', data);
        
        let qrCodeData = null;
        
        // Verificar diferentes formatos de resposta da Evolution API
        if (data.pairingCode) {
          // Evolution API v1 retorna pairingCode para QR Code
          qrCodeData = data.pairingCode;
          console.log('📱 Pairing code recebido:', qrCodeData);
        } else if (data.code) {
          // Formato alternativo
          qrCodeData = data.code;
          console.log('📱 Code recebido:', qrCodeData);
        } else if (data.base64) {
          qrCodeData = data.base64;
        } else if (data.qrcode && data.qrcode.base64) {
          qrCodeData = data.qrcode.base64;
        } else if (data.qr) {
          qrCodeData = data.qr;
        } else if (typeof data === 'string') {
          qrCodeData = data;
        }
        
        if (qrCodeData) {
          // Para QR Code string, usar QRCodeSVG component
          setQrCode(qrCodeData);
          setQrCodeSuccess('QR Code gerado com sucesso! Escaneie com seu WhatsApp.');
          setConnectionStatus('connecting');
          console.log('✅ QR Code gerado com sucesso');
          
          // Iniciar verificação de status
          setTimeout(() => {
            checkConnectionStatus(instanceForm.instanceName);
          }, 5000);
        } else {
          setQrCodeError('QR Code não disponível. A instância pode já estar conectada ou houve um erro na resposta da API.');
          console.error('❌ QR Code não encontrado na resposta');
          console.log('Resposta completa:', data);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        let errorMessage = errorData.message || `Erro HTTP ${response.status}: ${response.statusText}`;
        
        // Categorizar tipos de erro com mensagens mais claras
        if (response.status === 401 || response.status === 403) {
          setErrorType('config');
          errorMessage = '🔑 Erro de autenticação: Verifique sua API Key';
        } else if (response.status === 404) {
          setErrorType('api');
          errorMessage = '🔍 Instância não encontrada: Crie a instância primeiro';
        } else if (response.status === 409) {
          setErrorType('api');
          errorMessage = '⚠️ Instância já está conectada ou em uso';
        } else if (response.status >= 500) {
          setErrorType('api');
          errorMessage = '🔧 Erro no servidor da Evolution API: Tente novamente em alguns minutos';
        } else {
          setErrorType('api');
          errorMessage = `🚫 Erro da API: ${errorMessage}`;
        }
        
        setQrCodeError(errorMessage);
        console.error('❌ Erro da Evolution API:', errorData);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setErrorType('timeout');
          setQrCodeError('⏱️ Timeout na conexão: A API demorou muito para responder');
        } else if (error.message.includes('fetch')) {
          setErrorType('network');
          setQrCodeError('🌐 Erro de conexão: Verifique se a URL da API está correta e acessível');
        } else {
          setErrorType('network');
          setQrCodeError(`❌ Erro: ${error.message}`);
        }
      } else {
        setErrorType('network');
        setQrCodeError('❌ Erro inesperado: Tente novamente ou verifique sua conexão');
      }
    } finally {
      setQrCodeLoading(false);
    }
  };

  // Função para verificar status de conexão da instância
  const checkConnectionStatus = async (instanceName: string) => {
    if (!evolutionConfig.isConfigured || !instanceName) return;

    try {
      console.log('🔍 Verificando status da instância:', instanceName);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${evolutionConfig.apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => ({ instances: [] }));
        console.log('📊 Status das instâncias:', data);
        
        // Procurar pela instância específica
        let instanceData = null;
        if (Array.isArray(data)) {
          instanceData = data.find(inst => inst.instance?.instanceName === instanceName);
        } else if (data.instance && data.instance.instanceName === instanceName) {
          instanceData = data;
        }
        
        if (instanceData) {
          const status = instanceData.instance?.state || instanceData.state || 'unknown';
          console.log(`📱 Status da instância ${instanceName}:`, status);
          
          if (status === 'open' || status === 'connected') {
            setConnectionStatus('connected');
            setQrCodeSuccess('✅ WhatsApp conectado com sucesso!');
            setQrCode(''); // Limpar QR Code quando conectado
            
            // Salvar instância no banco de dados se ainda não foi salva
            try {
              await saveInstanceToDB({
                instanceName: instanceName,
                status: 'connected',
                evolutionApiUrl: evolutionConfig.apiUrl,
                evolutionApiKey: evolutionConfig.apiKey,
                connectedAt: new Date().toISOString()
              });
              console.log('💾 Instância salva no banco de dados');
            } catch (saveError) {
              console.warn('⚠️ Erro ao salvar instância no banco:', saveError);
            }
            
            // Recarregar lista de instâncias
            loadInstances();
          } else if (status === 'connecting' || status === 'qrcode') {
            setConnectionStatus('connecting');
            // Continuar verificando em 5 segundos
            setTimeout(() => checkConnectionStatus(instanceName), 5000);
          } else if (status === 'close' || status === 'disconnected') {
            setConnectionStatus('disconnected');
            setQrCodeError('❌ Conexão perdida. Gere um novo QR Code.');
          }
        } else {
          console.log('⚠️ Instância não encontrada na lista');
          // Tentar novamente em 5 segundos
          setTimeout(() => checkConnectionStatus(instanceName), 5000);
        }
      } else {
        console.error('❌ Erro ao verificar status:', response.status);
        // Tentar novamente em 10 segundos em caso de erro
        setTimeout(() => checkConnectionStatus(instanceName), 10000);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status de conexão:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        // Tentar novamente em 10 segundos, exceto se foi cancelado
        setTimeout(() => checkConnectionStatus(instanceName), 10000);
      }
    }
  };

  const saveInstanceToDB = async (instanceData: any) => {
    try {
      console.log('💾 Salvando instância no banco de dados:', instanceData);
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token para salvar:', token ? 'Presente' : 'Ausente');
      
      const response = await fetch('/api/whatsapp-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(instanceData),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({ instance: null }));
        return data.instance?.instanceName || instanceData.instanceName;
      } else if (response.status === 409) {
        // Instância já existe, tentar com nome único múltiplas vezes
        let attempt = 0;
        let success = false;
        let finalData = null;
        
        while (attempt < 5 && !success) {
          const uniqueName = `${instanceData.instanceName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const updatedData = { ...instanceData, instanceName: uniqueName };
          
          const retryResponse = await fetch('/api/whatsapp-instances', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(updatedData),
          });

          if (retryResponse.ok) {
            finalData = await retryResponse.json();
            success = true;
            return finalData.instance?.instanceName || uniqueName;
          } else if (retryResponse.status === 409) {
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Pequena pausa
          } else {
            const errorData = await retryResponse.json();
            throw new Error(`Erro ao salvar instância no banco de dados: ${errorData.error || retryResponse.statusText}`);
          }
        }
        
        if (!success) {
          throw new Error('Não foi possível criar uma instância com nome único após múltiplas tentativas');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(`Erro ao salvar instância no banco de dados: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao salvar instância:', error);
      throw error;
    }
  };

  // Função para renovar QR Code expirado
  const refreshQRCode = async () => {
    setQrCodeExpired(false);
    setQrCode('');
    setConnectionStatus('disconnected');
    setQrCodeError('');
    setQrCodeSuccess('');
    await getQRCode();
  };

  const deleteInstance = async (instanceId?: string) => {
    try {
      // Encontrar a instância a ser deletada
      let targetInstance;
      
      if (instanceId) {
        // Deletar instância específica por ID
        targetInstance = instances.find(inst => inst.id === instanceId);
        if (!targetInstance) {
          setInstanceError('Instância não encontrada');
          return;
        }
      } else {
        // Deletar instância pelo nome (método antigo)
        if (!instanceForm.instanceName.trim()) {
          setInstanceError('Por favor, selecione uma instância para deletar');
          return;
        }
        
        targetInstance = instances.find(inst => inst.instanceName === instanceForm.instanceName);
        if (!targetInstance) {
          setInstanceError('Instância não encontrada');
          return;
        }
      }

      setInstanceLoading(true);
      setInstanceError('');
      setInstanceSuccess('');

      // Deletar na Evolution API usando o endpoint correto da v1
      // Documentação: https://doc.evolution-api.com/v1/api-reference/instance-controller/instance-delete
      const deleteUrl = `${evolutionConfig.apiUrl}/instance/delete/${encodeURIComponent(targetInstance.instanceName)}`;
      console.log('🗑️ Deletando instância na Evolution API:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey
        }
      });
      
      console.log('📊 Status da deleção:', response.status);

      if (response.ok) {
        // Deletar no banco de dados
        await deleteInstanceFromDB(targetInstance.id);
        
        setInstanceSuccess(`Instância '${targetInstance.instanceName}' deletada com sucesso!`);
        
        // Limpar campos apenas se foi deletada pelo método antigo
        if (!instanceId) {
          setInstanceForm(prev => ({ ...prev, instanceName: '' }));
        }
        
        // Recarregar instâncias
        loadInstances();
      } else {
        const data = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        setInstanceError(data.message || 'Erro ao deletar instância no Evolution API');
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      setInstanceError('Erro de conexão com a API Evolution');
    } finally {
      setInstanceLoading(false);
    }
  };

  const deleteInstanceFromDB = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/whatsapp-instances?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    });

      if (!response.ok) {
        throw new Error('Erro ao deletar instância do banco de dados');
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      throw error;
    }
  };

  // Função para gerar QR Code com retry automático
  const generateQRCodeWithRetry = async (savedInstance: any, instanceName: string, maxRetries: number = 5) => {
    console.log(`🔄 Tentando gerar QR Code para ${instanceName} (máximo ${maxRetries} tentativas)`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} para gerar QR Code`);
        
        // Aguardar um tempo progressivo entre tentativas
        if (attempt > 1) {
          const waitTime = attempt * 2000; // 2s, 4s, 6s, 8s, 10s
          console.log(`⏳ Aguardando ${waitTime}ms antes da tentativa ${attempt}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        const connectResponse = await fetch(`${evolutionConfig.apiUrl}/instance/connect/${encodeURIComponent(instanceName)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionConfig.apiKey
          }
        });
        
        console.log(`📊 Status da tentativa ${attempt}:`, connectResponse.status);
        
        if (connectResponse.ok) {
          const connectData = await connectResponse.json();
          console.log(`✅ Resposta da tentativa ${attempt}:`, connectData);
          
          // Processar QR Code
          let qrCodeData = null;
          if (connectData.base64) {
            qrCodeData = connectData.base64;
          } else if (connectData.qrcode && connectData.qrcode.base64) {
            qrCodeData = connectData.qrcode.base64;
          } else if (connectData.qr) {
            qrCodeData = connectData.qr;
          } else if (typeof connectData === 'string') {
            qrCodeData = connectData;
          } else if (connectData.pairingCode) {
            qrCodeData = connectData.pairingCode;
          } else if (connectData.code) {
            qrCodeData = connectData.code;
          }
          
          if (qrCodeData) {
            const formattedQRCode = qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}`;
            
            // Atualizar instância no banco com QR Code
            const token = localStorage.getItem('authToken');
            const updateResponse = await fetch('/api/whatsapp-instances', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                id: savedInstance.id,
                qrCode: formattedQRCode,
                status: 'connecting'
              })
            });
            
            if (updateResponse.ok) {
              console.log(`✅ QR Code gerado e salvo com sucesso na tentativa ${attempt}`);
              
              // Atualizar interface imediatamente
              setInstanceQrCodes(prev => ({ ...prev, [savedInstance.id]: formattedQRCode }));
              setInstances(prev => prev.map(inst => 
                inst.id === savedInstance.id ? {
                  ...inst,
                  qrCode: formattedQRCode,
                  status: 'connecting'
                } : inst
              ));
              
              // Recarregar instâncias para sincronizar
              loadInstances();
              return; // Sucesso, sair da função
            } else {
              const updateErrorText = await updateResponse.text();
              console.error(`❌ Erro ao salvar QR Code na tentativa ${attempt}:`, updateResponse.status, updateErrorText);
              throw new Error(`Erro ao atualizar instância no banco: ${updateResponse.status} - ${updateErrorText}`);
            }
          } else {
            console.warn(`⚠️ QR Code não encontrado na resposta da tentativa ${attempt}`);
          }
        } else {
          const errorText = await connectResponse.text();
          console.error(`❌ Erro na tentativa ${attempt}:`, connectResponse.status, errorText);
        }
      } catch (error) {
        console.error(`❌ Erro na tentativa ${attempt}:`, error);
      }
    }
    
    const errorMessage = `Falha ao gerar QR Code após ${maxRetries} tentativas para ${instanceName}`;
    console.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  };

  const generateInstanceQRCode = async (instance: WhatsAppInstance) => {
    console.log('🚀 Gerando QR Code para instância:', instance.instanceName);
    console.log('🔧 Configuração atual da Evolution:', evolutionConfig);
    
    if (!evolutionConfig.isConfigured) {
      setInstanceError('Configure a API Evolution primeiro');
      return;
    }
    
    setInstanceLoadings(prev => ({ ...prev, [instance.id]: true }));
    
    try {
      // Gerar QR Code usando os dados da instância
      await generateQRCodeWithRetry(instance, instance.instanceName, 3);
      
      // Iniciar verificação periódica do status de conexão
      const checkConnectionInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${instance.apiUrl}/instance/connectionState/${instance.instanceId || instance.instanceName}`, {
            headers: {
              'apikey': instance.apiKey
            }
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json().catch(() => ({ state: 'unknown' }));
            console.log('🔍 Status da conexão:', statusData);
            
            if (statusData.state === 'open') {
              console.log('✅ WhatsApp conectado! Atualizando status no banco...');
              clearInterval(checkConnectionInterval);
              
              // Atualizar status no banco de dados após conexão bem-sucedida
              const updateResponse = await fetch('/api/whatsapp-instances', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                  id: instance.id,
                  status: 'open'
                })
              });
              
              if (updateResponse.ok) {
                const updatedInstance = await updateResponse.json().catch(() => ({ id: instance.id }));
                console.log('✅ Status da instância atualizado:', updatedInstance);
                setInstanceSuccess(`Instância '${instance.instanceName}' conectada com sucesso!`);
                
                // Recarregar instâncias para mostrar o novo status
                loadInstances();
              } else {
                const errorData = await updateResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
                console.error('❌ Erro ao atualizar status da instância:', errorData);
                setInstanceError(`WhatsApp conectado, mas erro ao atualizar status: ${errorData.error || updateResponse.statusText}`);
              }
            }
          }
        } catch (error) {
          console.error('❌ Erro ao verificar status da conexão:', error);
        }
      }, 3000); // Verificar a cada 3 segundos
      
      // Limpar intervalo após 5 minutos para evitar loop infinito
      setTimeout(() => {
        clearInterval(checkConnectionInterval);
        console.log('⏰ Timeout na verificação de conexão');
      }, 300000);
      
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
      setInstanceError(`Erro ao gerar QR Code: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setInstanceLoadings(prev => ({ ...prev, [instance.id]: false }));
    }
    
    // Lógica original para instâncias já salvas no banco
    if (!evolutionConfig.isConfigured) {
      console.error('❌ Evolution API não configurada');
      console.log('📋 Estado da configuração:', {
        apiUrl: evolutionConfig.apiUrl,
        hasApiKey: !!evolutionConfig.apiKey,
        isConfigured: evolutionConfig.isConfigured
      });
      return;
    }

    if (!evolutionConfig.apiUrl || !evolutionConfig.apiKey) {
      console.error('❌ URL ou API Key não configurados');
      console.log('📋 Configuração:', {
        apiUrl: evolutionConfig.apiUrl,
        apiKey: evolutionConfig.apiKey ? '[CONFIGURADA]' : '[NÃO CONFIGURADA]'
      });
      return;
    }

    setInstanceLoadings(prev => ({ ...prev, [instance.id]: true }));
    
    try {
      // Usar a função de retry para regenerar QR Code
      await generateQRCodeWithRetry(instance, instance.instanceName, 3);
    } catch (error) {
      console.error('❌ Erro ao regenerar QR Code:', error);
    } finally {
      setInstanceLoadings(prev => ({ ...prev, [instance.id]: false }));
    }
  };

  const generateInstanceQRCodeOld = async (instance: WhatsAppInstance) => {
    
    try {
      // Usar o instanceName existente da instância
      const instanceName = instance.instanceName;
      
      console.log('🔗 Regenerando QR Code para instância:', instanceName);
      console.log('📋 Dados da instância:', instance);
      
      // Conectar à instância existente para obter novo QR Code
      const connectUrl = `${evolutionConfig.apiUrl}/instance/connect/${encodeURIComponent(instanceName)}`;
      console.log('🌐 URL de conexão:', connectUrl);
      
      const response = await fetch(connectUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.apiKey
        }
      });
      
      console.log('📊 Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na requisição de conexão:', response.status, response.statusText);
        console.error('❌ Detalhes do erro:', errorText);
        
        // Se a instância não existir (404), criar automaticamente
        if (response.status === 404) {
          console.log('🔄 Instância não existe na Evolution API, criando automaticamente...');
          
          try {
            // Criar instância na Evolution API
            const createResponse = await fetch(`${evolutionConfig.apiUrl}/instance/create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionConfig.apiKey
              },
              body: JSON.stringify({
                instanceName: instanceName,
                integration: 'WHATSAPP-BAILEYS'
              })
            });
            
            if (createResponse.ok) {
              console.log('✅ Instância criada na Evolution API, tentando conectar novamente...');
              
              // Aguardar um pouco para a instância estar pronta
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Tentar conectar novamente
              const retryResponse = await fetch(connectUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionConfig.apiKey
                }
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json().catch(() => ({ qrcode: null }));
                console.log('✅ Conexão bem-sucedida após criar instância');
                
                // Processar QR Code
                let qrCodeData = null;
                if (retryData.base64) {
                  qrCodeData = retryData.base64;
                } else if (retryData.qrcode && retryData.qrcode.base64) {
                  qrCodeData = retryData.qrcode.base64;
                } else if (retryData.qr) {
                  qrCodeData = retryData.qr;
                } else if (typeof retryData === 'string') {
                  qrCodeData = retryData;
                }
                
                if (qrCodeData) {
                  const formattedQRCode = qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}`;
                  
                  // Atualizar instância no banco com QR Code
                  const token = localStorage.getItem('authToken');
                  const updateResponse = await fetch('/api/whatsapp-instances', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      id: instance.id,
                      qrCode: formattedQRCode,
                      status: 'connecting'
                    })
                  });
                  
                  if (updateResponse.ok) {
                    console.log('✅ QR Code gerado e salvo após criar instância');
                    
                    // Atualizar interface
                    setInstanceQrCodes(prev => ({ ...prev, [instance.id]: formattedQRCode }));
                    setInstances(prev => prev.map(inst => 
                      inst.id === instance.id ? {
                        ...inst,
                        qrCode: formattedQRCode,
                        status: 'connecting'
                      } : inst
                    ));
                    
                    // Recarregar instâncias
                    loadInstances();
                    return; // Sair da função com sucesso
                  }
                }
              } else {
                console.error('❌ Falha ao conectar após criar instância');
              }
            } else {
              console.error('❌ Falha ao criar instância na Evolution API');
            }
          } catch (createError) {
            console.error('❌ Erro ao criar instância:', createError);
          }
          
          // Se chegou até aqui, houve erro
          setInstanceQrCodes(prev => ({ ...prev, [instance.id]: null }));
        }
        return;
      }
 
      // Processar resposta bem-sucedida
      const data = await response.json().catch(() => ({ qrcode: null }));
      console.log('✅ Resposta da Evolution API recebida');
      
      // Processar QR Code e salvar no banco
      let qrCodeData = null;
      if (data.base64) {
        qrCodeData = data.base64;
      } else if (data.qrcode && data.qrcode.base64) {
        qrCodeData = data.qrcode.base64;
      } else if (data.qr) {
        qrCodeData = data.qr;
      } else if (typeof data === 'string') {
        qrCodeData = data;
      }
      
      if (qrCodeData) {
        const formattedQRCode = qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}`;
        
        // Atualizar instância no banco com novo QR Code
        const token = localStorage.getItem('authToken');
        const updateResponse = await fetch('/api/whatsapp-instances', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: instance.id,
            qrCode: formattedQRCode,
            status: 'connecting'
          })
        });
        
        if (updateResponse.ok) {
          console.log('✅ QR Code regenerado e salvo no banco');
          
          // Atualizar interface
          setInstanceQrCodes(prev => ({ ...prev, [instance.id]: formattedQRCode }));
          setInstances(prev => prev.map(inst => 
            inst.id === instance.id ? {
              ...inst,
              qrCode: formattedQRCode,
              status: 'connecting'
            } : inst
          ));
          
          // Recarregar instâncias
          loadInstances();
        } else {
          console.error('❌ Erro ao salvar QR Code no banco');
        }
      } else {
        console.warn('⚠️ QR Code não disponível - instância pode já estar conectada');
        setInstanceQrCodes(prev => ({ ...prev, [instance.id]: null }));
      }
       
     } catch (error) {
       console.error('❌ Erro ao regenerar QR Code:', error);
     } finally {
       setInstanceLoadings(prev => ({ ...prev, [instance.id]: false }));
     }
   };
   
   // Função auxiliar para processar a resposta do QR Code (sem salvar no banco)
    const processQRCodeResponse = async (data: any, instance: WhatsAppInstance, dynamicInstanceName: string) => {
      try {
         console.log('📱 Resposta da Evolution API:', data);
        
        let qrCodeData = null;
        
        // Processar resposta da Evolution API v1
        // Baseado na documentação: https://doc.evolution-api.com/v1/api-reference/instance-controller/instance-connect
        if (data.pairingCode) {
          // Evolution API v1 retorna pairingCode para QR Code
          qrCodeData = data.pairingCode;
          console.log('📱 Pairing code recebido:', qrCodeData);
        } else if (data.code) {
          // Formato alternativo
          qrCodeData = data.code;
          console.log('📱 Code recebido:', qrCodeData);
        } else if (data.base64) {
          qrCodeData = data.base64;
        } else if (data.qrcode && data.qrcode.base64) {
          qrCodeData = data.qrcode.base64;
        } else if (data.qr) {
          qrCodeData = data.qr;
        } else if (typeof data === 'string') {
          qrCodeData = data;
        }
        
        if (qrCodeData) {
          const formattedQRCode = qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}`;
          
          // Exibir o QR Code na interface
          setInstanceQrCodes(prev => ({ ...prev, [instance.id]: formattedQRCode }));
          
          // Atualizar status visual temporário
          setInstances(prev => prev.map(inst => 
            inst.id === instance.id ? { ...inst, status: 'qr_code', qrCode: formattedQRCode } : inst
          ));
          
          console.log('✅ QR Code gerado e exibido (aguardando conexão para salvar)');
          console.log('🔗 Instance dinâmica:', dynamicInstanceName);
        } else {
          console.error('❌ QR Code não encontrado na resposta da API');
          console.log('Resposta completa:', data);
        }
      } catch (error) {
        console.error('❌ Erro ao processar resposta do QR Code:', error);
      } finally {
        setInstanceLoadings(prev => ({ ...prev, [instance.id]: false }));
      }
    };

  // Função para monitorar status da instância e salvar no banco quando conectar
  const startInstanceMonitoring = (dynamicInstanceName: string, baseInstance: WhatsAppInstance) => {
    console.log('🔄 Iniciando monitoramento da instância:', dynamicInstanceName);
    
    const checkInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${evolutionConfig.apiUrl}/instance/connectionState/${encodeURIComponent(dynamicInstanceName)}`, {
          headers: {
            'apikey': evolutionConfig.apiKey
          }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const evolutionStatus = statusData.instance?.state;
          
          console.log('📊 Status da instância:', evolutionStatus);
          
          if (evolutionStatus === 'open') {
            console.log('✅ Instância conectada! Salvando no banco...');
            clearInterval(checkInterval);
            
            // Obter informações do perfil conectado
            const profileName = statusData.instance?.profileName || '';
            const phoneNumber = statusData.instance?.phoneNumber || statusData.instance?.number || '';
            
            // Salvar instância no banco com dados reais
            const token = localStorage.getItem('authToken');
            const saveResponse = await fetch('/api/whatsapp-instances', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                id: baseInstance.id,
                instanceName: dynamicInstanceName, // Usar o nome dinâmico
                status: 'connected',
                phoneNumber: phoneNumber,
                qrCode: null, // Limpar QR code após conexão
                isActive: true
              })
            });
            
            if (saveResponse.ok) {
              console.log('✅ Instância salva no banco com sucesso!');
              
              // Atualizar interface
              setInstanceQrCodes(prev => ({ ...prev, [baseInstance.id]: null }));
              setInstances(prev => prev.map(inst => 
                inst.id === baseInstance.id ? {
                  ...inst,
                  instanceName: dynamicInstanceName,
                  status: 'connected',
                  phoneNumber: phoneNumber,
                  qrCode: null,
                  isActive: true
                } : inst
              ));
              
              // Recarregar lista de instâncias
              loadInstances();
            } else {
              console.error('❌ Erro ao salvar instância no banco');
            }
          }
        } else if (statusResponse.status === 404) {
          console.warn('⚠️ Instância não encontrada, parando monitoramento');
          clearInterval(checkInterval);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos
    
    // Parar monitoramento após 10 minutos (timeout)
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('⏰ Timeout do monitoramento da instância:', dynamicInstanceName);
    }, 600000); // 10 minutos
  };

  useEffect(() => {
    // Carregar configuração do localStorage
    const savedConfig = localStorage.getItem('evolutionConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setEvolutionConfig(parsedConfig);
      } catch (error) {
        console.error('Erro ao carregar configuração salva:', error);
      }
    }
    
    loadInstances();
    
    // Verificar status das instâncias a cada 30 segundos
    const statusInterval = setInterval(() => {
      if (evolutionConfig.isConfigured) {
        console.log('🔄 Verificação periódica do status das instâncias...');
        loadInstances();
      }
    }, 30000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [evolutionConfig.isConfigured]);

  return (
    <div className="space-y-6">
      {/* Formulário de Configuração da API Evolution */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src="https://evolution.bpofinanceiro.shop/assets/images/evolution-logo.png" 
              alt="Evolution API Logo" 
              className="w-8 h-8 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <h3 className="text-lg font-semibold text-white">Configuração da Evolution API</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            evolutionConfig.isConfigured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {evolutionConfig.isConfigured ? 'Conectado' : 'Desconectado'}
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <span>{showInstructions ? 'v' : '>'}</span>
            <span>Como usar a Evolution API</span>
          </button>
          
          {showInstructions && (
            <div className="mt-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>1. Configuração:</strong> Insira a URL da sua API Evolution e a API Key nos campos abaixo.</p>
                <p><strong>2. Criar Instância:</strong> Digite um nome único para sua instância e clique em "Criar Instância".</p>
                <p><strong>3. Gerar QR Code:</strong> Após criar a instância, clique em "Gerar QR Code" para obter o código QR.</p>
                <p><strong>4. Conectar WhatsApp:</strong> Abra o WhatsApp no seu celular, vá em "Dispositivos conectados" e escaneie o QR Code.</p>
                <p><strong>5. Verificar Status:</strong> Use "Verificar Status" para confirmar se a instância está conectada.</p>
                <p><strong>6. Gerenciar:</strong> Você pode deletar instâncias quando não precisar mais delas.</p>
                
                <div className="mt-3 p-3 bg-gray-600 rounded">
                  <p className="font-medium text-white">Dicas importantes:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Cada instância representa uma conexão WhatsApp independente</li>
                    <li>Mantenha sua API Key segura e não a compartilhe</li>
                    <li>O QR Code expira após alguns minutos, gere um novo se necessário</li>
                    <li>Uma vez conectada, a instância ficará ativa até ser desconectada</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL da API Evolution
            </label>
            <input
              type="url"
              value={evolutionConfig.apiUrl}
              onChange={(e) => setEvolutionConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://sua-api-evolution.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={evolutionConfig.apiKey}
              onChange={(e) => setEvolutionConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sua API Key"
            />
          </div>

          {/* Mensagens de erro/sucesso da configuração */}
          {configError && (
            <div className="p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-md">
              <p className="text-red-300 text-sm">{configError}</p>
            </div>
          )}
          
          {configSuccess && (
            <div className="p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-md">
              <p className="text-green-300 text-sm">{configSuccess}</p>
            </div>
          )}

          <button
            onClick={evolutionConfig.isConfigured ? loadEvolutionInstances : saveEvolutionConfig}
            disabled={configLoading || (!evolutionConfig.isConfigured && (!evolutionConfig.apiUrl.trim() || !evolutionConfig.apiKey.trim()))}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {configLoading ? 'Testando...' : 
             evolutionConfig.isConfigured ? 'Listar Instâncias' : 'Salvar e Testar Integração'}
          </button>
        </div>
      </div>

      {/* Formulário de Cadastro de Instâncias */}
      {evolutionConfig.isConfigured && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Cadastro de Instâncias</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome da Instância
              </label>
              <input
                type="text"
                value={instanceForm.instanceName}
                onChange={(e) => setInstanceForm(prev => ({ ...prev, instanceName: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="minha-instancia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Channel
              </label>
              <select
                value={instanceForm.channel}
                onChange={(e) => setInstanceForm(prev => ({ ...prev, channel: e.target.value as 'BAILEYS' | 'WHATSAPP_CLOUD_API' | 'EVOLUTION' }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BAILEYS">Baileys</option>
                <option value="WHATSAPP_CLOUD_API">WhatsApp Cloud API</option>
                <option value="EVOLUTION">Evolution</option>
              </select>
            </div>

            {/* Campo Token oculto - gerado automaticamente pela Evolution API */}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número do WhatsApp
              </label>
              <input
                type="tel"
                value={instanceForm.phoneNumber}
                onChange={(e) => setInstanceForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5511999999999"
              />
            </div>

            {/* Mensagens de erro/sucesso das instâncias */}
            {instanceError && (
              <div className="p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-md">
                <p className="text-red-300 text-sm">{instanceError}</p>
              </div>
            )}

            {instanceSuccess && (
              <div className="p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-md">
                <p className="text-green-300 text-sm">{instanceSuccess}</p>
              </div>
            )}

            <button
              onClick={createInstance}
              disabled={instanceLoading || !instanceForm.instanceName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {instanceLoading ? 'Criando Instância...' : 'Criar Instância'}
            </button>
          </div>
        </div>
      )}

      {/* Seção de QR Code */}
      {evolutionConfig.isConfigured && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Gerar QR Code</h3>
          
          {/* Mensagens de erro/sucesso do QR Code */}
          {qrCodeError && (
            <div className={`p-3 rounded-md mb-4 border ${
              errorType === 'network' ? 'bg-orange-900 bg-opacity-50 border-orange-700' :
              errorType === 'config' ? 'bg-yellow-900 bg-opacity-50 border-yellow-700' :
              errorType === 'timeout' ? 'bg-blue-900 bg-opacity-50 border-blue-700' :
              'bg-red-900 bg-opacity-50 border-red-700'
            }`}>
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  {errorType === 'network' && '🌐'}
                  {errorType === 'config' && '🔑'}
                  {errorType === 'timeout' && '⏱️'}
                  {errorType === 'api' && '🔧'}
                  {!errorType && '❌'}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${
                    errorType === 'network' ? 'text-orange-300' :
                    errorType === 'config' ? 'text-yellow-300' :
                    errorType === 'timeout' ? 'text-blue-300' :
                    'text-red-300'
                  }`}>{qrCodeError}</p>
                  {errorType === 'config' && (
                    <p className="text-xs text-yellow-400 mt-1">
                      💡 Dica: Vá para a seção de configuração e teste a conexão
                    </p>
                  )}
                  {errorType === 'network' && (
                    <p className="text-xs text-orange-400 mt-1">
                      💡 Dica: Verifique se a URL está correta e se o servidor está online
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {qrCodeSuccess && (
            <div className="p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-md mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <p className="text-green-300 text-sm">{qrCodeSuccess}</p>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-4">
            <button
              onClick={getQRCode}
              disabled={qrCodeLoading || !instanceForm.instanceName.trim() || connectionStatus === 'connecting'}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {qrCodeLoading ? 'Gerando QR Code...' : connectionStatus === 'connecting' ? 'Aguardando conexão...' : 'Gerar QR Code'}
            </button>
            
            {qrCodeExpired && (
              <button
                onClick={refreshQRCode}
                disabled={qrCodeLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {qrCodeLoading ? 'Renovando...' : '🔄 Renovar QR Code'}
              </button>
            )}
          </div>

          {qrCode && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <h4 className="text-md font-medium text-white mb-3">QR Code para WhatsApp:</h4>
              <div className="flex justify-center relative">
                <div className="relative">
                  <QRCodeSVG 
                          value={qrCode} 
                          size={300} 
                          bgColor="#FFFFFF" 
                          fgColor="#000000" 
                          className="bg-white p-4 rounded-lg shadow-lg" 
                        />
                  {connectionStatus === 'connecting' && (
                    <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center rounded">
                      <div className="text-center">
                        <div className="animate-pulse text-blue-600 text-sm font-medium">Aguardando conexão...</div>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mt-2"></div>
                      </div>
                    </div>
                  )}
                  {connectionStatus === 'connected' && (
                    <div className="absolute inset-0 bg-green-50 bg-opacity-90 flex items-center justify-center rounded">
                      <div className="text-center">
                        <div className="text-green-600 text-lg font-bold">✅</div>
                        <div className="text-green-600 text-sm font-medium">Conectado!</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-3 text-center">
                {connectionStatus === 'connecting' 
                  ? 'Escaneie este QR Code com seu WhatsApp e aguarde a conexão automática'
                  : connectionStatus === 'connected'
                  ? 'WhatsApp conectado com sucesso!'
                  : 'Escaneie este QR Code com seu WhatsApp para conectar a instância.'
                }
              </p>
              {connectionStatus === 'connecting' && (
                <div className="mt-2 text-xs text-blue-400 text-center">
                  Verificando conexão automaticamente a cada 3 segundos...
                </div>
              )}
            </div>
          )}

          {/* Botão para mostrar instâncias da Evolution */}
          {evolutionConfig.isConfigured && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowEvolutionInstances(!showEvolutionInstances);
                  if (!showEvolutionInstances) {
                    loadEvolutionInstances();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {showEvolutionInstances ? 'Ocultar' : 'Mostrar'} Instâncias Evolution
              </button>
            </div>
          )}

          {/* Instâncias da Evolution API */}
          {showEvolutionInstances && (
            <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="text-md font-medium text-white mb-3">Instâncias Evolution API ({evolutionInstances.length})</h4>
              {evolutionLoading ? (
                <p className="text-gray-400">Carregando instâncias da Evolution...</p>
              ) : (
                <div className="space-y-3">
                  {evolutionInstances.map((evInstance, index) => {
                    // Tentar diferentes estruturas de dados da Evolution API
                    const instanceData = evInstance.instance || evInstance;
                    const instanceName = instanceData?.instanceName || instanceData?.name || instanceData?.instance_name || 'N/A';
                    const instanceId = instanceData?.instanceId || instanceData?.id || instanceData?.instance_id || 'N/A';
                    const instanceState = instanceData?.state || instanceData?.status || instanceData?.connectionStatus || 'unknown';
                    const phoneNumber = instanceData?.phoneNumber || instanceData?.phone || instanceData?.number || null;
                    const owner = instanceData?.owner || instanceData?.profileName || null;
                    const avatar = instanceData?.profilePictureUrl || instanceData?.avatar || null;
                    const serverUrl = instanceData?.serverUrl || instanceData?.apiUrl || null;
                    const connectionStatus = instanceData?.connectionStatus || null;
                    const lastSeen = instanceData?.lastSeen || null;
                    
                    return (
                      <div key={index} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-white text-lg">{instanceName}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            instanceState === 'open' || instanceState === 'connected' ? 'bg-green-100 text-green-800' :
                            instanceState === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                            instanceState === 'close' || instanceState === 'disconnected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {instanceState}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-600 p-3 rounded">
                            <span className="font-medium text-gray-300">ID da Instância:</span>
                            <div className="text-white mt-1 font-mono">{instanceId}</div>
                          </div>
                          
                          {phoneNumber && (
                            <div className="bg-gray-600 p-3 rounded">
                              <span className="font-medium text-gray-300">Telefone:</span>
                              <div className="text-white mt-1">{phoneNumber}</div>
                            </div>
                          )}
                          
                          {owner && (
                            <div className="bg-gray-600 p-3 rounded">
                              <span className="font-medium text-gray-300">Proprietário:</span>
                              <div className="text-white mt-1">{owner}</div>
                            </div>
                          )}
                          
                          {connectionStatus && connectionStatus !== instanceState && (
                            <div className="bg-gray-600 p-3 rounded">
                              <span className="font-medium text-gray-300">Status de Conexão:</span>
                              <div className="text-white mt-1">{connectionStatus}</div>
                            </div>
                          )}
                          
                          {serverUrl && (
                            <div className="bg-gray-600 p-3 rounded md:col-span-2">
                              <span className="font-medium text-gray-300">Servidor:</span>
                              <div className="text-white mt-1 break-all text-xs">{serverUrl}</div>
                            </div>
                          )}
                          
                          {lastSeen && (
                            <div className="bg-gray-600 p-3 rounded">
                              <span className="font-medium text-gray-300">Última Atividade:</span>
                              <div className="text-white mt-1">
                                {new Date(lastSeen).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          )}
                          
                          {avatar && (
                            <div className="bg-gray-600 p-3 rounded">
                              <span className="font-medium text-gray-300">Avatar:</span>
                              <div className="mt-2">
                                <img 
                                  src={avatar} 
                                  alt="Avatar" 
                                  className="w-12 h-12 rounded-full border-2 border-gray-500"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Informações técnicas adicionais */}
                         {Object.keys(instanceData || {}).length > 0 && (
                           <div className="mt-3 bg-gray-800 p-3 rounded border border-gray-500">
                             <div className="flex items-center justify-between mb-2">
                               <span className="font-medium text-blue-300 text-sm">Dados Técnicos Adicionais:</span>
                               <button 
                                 onClick={() => {
                                   const instanceKey = `${instanceName}-${index}`;
                                   setExpandedDetails(prev => ({
                                     ...prev,
                                     [instanceKey]: !prev[instanceKey]
                                   }));
                                 }}
                                 className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
                               >
                                 <span>{expandedDetails[`${instanceName}-${index}`] ? '▼' : '▶'}</span>
                                 <span>Ver Detalhes Completos</span>
                               </button>
                             </div>
                             {expandedDetails[`${instanceName}-${index}`] && (
                               <div className="text-xs text-gray-300 space-y-1 max-h-32 overflow-y-auto">
                                 {Object.entries(instanceData || {}).map(([key, value]) => {
                                   if (['instanceName', 'name', 'instance_name', 'instanceId', 'id', 'instance_id', 
                                        'phoneNumber', 'phone', 'number', 'state', 'status', 'owner', 'profileName',
                                        'profilePictureUrl', 'avatar', 'serverUrl', 'apiUrl', 'connectionStatus', 'lastSeen'].includes(key)) {
                                     return null;
                                   }
                                   
                                   // Formatação especial para ownerJid
                                   if (key === 'ownerJid' && typeof value === 'string') {
                                     const phoneNumber = value.replace('@s.whatsapp.net', '');
                                     return (
                                       <div key={key} className="flex justify-between items-start">
                                         <span className="font-medium text-blue-200 mr-2">WhatsApp ID:</span>
                                         <div className="text-right text-gray-300 max-w-48">
                                           <div className="font-mono">{phoneNumber}</div>
                                           <div className="text-xs text-gray-400">({value})</div>
                                         </div>
                                       </div>
                                     );
                                   }
                                   
                                   // Formatação especial para profilePicUrl
                                   if (key === 'profilePicUrl' && typeof value === 'string') {
                                     return (
                                       <div key={key} className="flex justify-between items-start">
                                         <span className="font-medium text-blue-200 mr-2">Foto do Perfil:</span>
                                         <a 
                                           href={value}
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="text-blue-400 hover:text-blue-300 underline text-right max-w-48 truncate"
                                           title={value}
                                         >
                                           {value.length > 30 ? `${value.substring(0, 30)}...` : value}
                                         </a>
                                       </div>
                                     );
                                   }
                                   
                                   return (
                                     <div key={key} className="flex justify-between items-start">
                                       <span className="font-medium text-blue-200 mr-2">{key}:</span>
                                       <span className="text-right text-gray-300 max-w-48 break-words">
                                         {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                       </span>
                                     </div>
                                   );
                                 })}
                               </div>
                             )}
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {instances.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-white">Instâncias WhatsApp CRM ({instances.length})</h4>
                <button
                  onClick={loadEvolutionInstances}
                  disabled={!evolutionConfig.isConfigured || evolutionLoading}
                  className="text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                >
                  {evolutionLoading ? 'Carregando...' : 'Atualizar Evolution'}
                </button>
              </div>
              <div className="space-y-3">
                 {instances.map((instance) => {
                   const evolutionMatch = findEvolutionMatch(instance);
                   return (
                     <div key={instance.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                       <div className="flex justify-between items-start mb-3">
                         <div className="flex-1">
                           <div className="flex items-center space-x-3 mb-2">
                             {/* Mostrar nome original do usuário */}
                             <span className="font-medium text-white">
                               {instance.instanceName.includes('_') ? 
                                 instance.instanceName.split('_')[0] : 
                                 instance.instanceName
                               }
                             </span>
                             {/* Mostrar ID técnico se diferente do nome */}
                             {instance.instanceName.includes('_') && (
                               <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                 ID Técnico: {instance.instanceName}
                               </span>
                             )}
                             {instance.instanceId && (
                               <span className="text-sm text-purple-300 bg-purple-900 px-2 py-1 rounded">
                                 UUID: {instance.instanceId}
                               </span>
                             )}
                             {instance.phoneNumber && (
                               <span className="text-sm text-blue-300 bg-blue-900 px-2 py-1 rounded">
                                 Tel: {instance.phoneNumber}
                               </span>
                             )}
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                               instance.status === 'connected' ? 'bg-green-100 text-green-800' :
                               instance.status === 'open' ? 'bg-green-100 text-green-800' :
                               instance.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                               instance.status === 'qr_code' ? 'bg-yellow-100 text-yellow-800' :
                               instance.status === 'close' ? 'bg-red-100 text-red-800' :
                               'bg-gray-100 text-gray-800'
                             }`}>
                               {instance.status === 'connected' ? '🟢 Conectado' :
                                instance.status === 'open' ? '🟢 Conectado' :
                                instance.status === 'connecting' ? '🟡 Conectando' :
                                instance.status === 'qr_code' ? '📱 Aguardando QR Code' :
                                instance.status === 'close' ? '🔴 Desconectado' :
                                instance.status}
                             </span>
                             {instance.isActive && (
                               <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                 Ativa
                               </span>
                             )}
                           </div>
                           
                           {/* Status de correspondência com Evolution */}
                           <div className="mb-2">
                             {evolutionMatch ? (
                               <div className="flex items-center space-x-2">
                                 <span className="text-xs text-green-400">✓ Conectada na Evolution:</span>
                                 <span className="text-xs text-green-300">
                                   {evolutionMatch.instance?.instanceName} ({evolutionMatch.instance?.state})
                                 </span>
                                 <span className="text-xs text-gray-400">
                                   ID: {evolutionMatch.instance?.instanceId}
                                 </span>
                               </div>
                             ) : (
                               <span className="text-xs text-red-400">✗ Não encontrada na Evolution API</span>
                             )}
                           </div>
                           
                           <div className="text-sm text-gray-400">
                             Criada em: {new Date(instance.createdAt).toLocaleDateString('pt-BR')}
                           </div>
                         </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => generateInstanceQRCode(instance)}
                        disabled={instanceLoadings[instance.id] || instance.status === 'open' || instance.status === 'connected'}
                        className={`text-sm font-medium px-3 py-2 rounded-md border transition-colors disabled:opacity-50 ${
                          (instance.status === 'open' || instance.status === 'connected')
                            ? 'text-green-400 border-green-600 bg-green-900 bg-opacity-40 cursor-default'
                            : 'text-yellow-400 border-yellow-600 bg-yellow-900 bg-opacity-20 hover:bg-yellow-900 hover:bg-opacity-40'
                        }`}
                      >
                        {instanceLoadings[instance.id] ? 'Gerando...' : 
                         (instance.status === 'open' || instance.status === 'connected') ? '✅ WhatsApp Conectado' : '📱 Gerar QR Code'}
                      </button>
                      
                      <button
                        onClick={async () => {
                          if (confirm(`Tem certeza que deseja excluir a instância "${instance.instanceName}"?`)) {
                            await deleteInstance(instance.id);
                          }
                        }}
                        disabled={instanceLoadings[instance.id]}
                        className="text-sm font-medium px-3 py-2 rounded-md border border-red-600 bg-red-900 bg-opacity-20 text-red-400 hover:bg-red-900 hover:bg-opacity-40 transition-colors disabled:opacity-50"
                      >
                        Excluir
                      </button>
                        </div>
                        
                        {/* QR Code específico da instância */}
                        {instanceQrCodes[instance.id] && (
                          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-500">
                            <h5 className="text-sm font-medium text-white mb-2">QR Code - {instance.instanceName}:</h5>
                            <div className="flex justify-center">
                              <QRCodeSVG 
                            value={instanceQrCodes[instance.id]} 
                            size={300} 
                            bgColor="#FFFFFF" 
                            fgColor="#000000" 
                            className="bg-white p-4 rounded-lg shadow-lg" 
                          />
                            </div>
                            <p className="text-xs text-gray-300 mt-2 text-center">
                              Escaneie com seu WhatsApp para conectar esta instância.
                            </p>
                          </div>
                        )}
                       </div>
                     );
                   })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}