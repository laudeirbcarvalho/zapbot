'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface DatabaseStatusProps {
  showDetails?: boolean;
}

interface ConnectionStatus {
  isConnected: boolean;
  error?: string;
  lastChecked: Date;
  details?: {
    host: string;
    port: number;
    database: string;
    user: string;
  };
}

export default function DatabaseStatus({ showDetails = false }: DatabaseStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/database/status');
      const data = await response.json();
      setStatus({
        ...data,
        lastChecked: new Date()
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        error: 'Erro ao verificar conexão com o banco de dados',
        lastChecked: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (!status && !isLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`p-4 rounded-lg border ${
        status?.isConnected 
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : status?.isConnected ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">
              {isLoading ? 'Verificando conexão...' : 
               status?.isConnected ? 'Banco conectado' : 'Erro de conexão'}
            </span>
          </div>
          <button
            onClick={checkConnection}
            disabled={isLoading}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Verificar novamente"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {status?.error && (
          <div className="mt-2 text-sm">
            <p className="font-medium">Erro:</p>
            <p className="break-words">{status.error}</p>
          </div>
        )}
        
        {showDetails && status?.details && (
          <div className="mt-3 text-sm space-y-1">
            <p><span className="font-medium">Host:</span> {status.details.host}</p>
            <p><span className="font-medium">Porta:</span> {status.details.port}</p>
            <p><span className="font-medium">Database:</span> {status.details.database}</p>
            <p><span className="font-medium">Usuário:</span> {status.details.user}</p>
          </div>
        )}
        
        {status?.lastChecked && (
          <div className="mt-2 text-xs opacity-70">
            Última verificação: {status.lastChecked.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}