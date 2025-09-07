interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

// Função para obter o token do localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

// Função para fazer requisições autenticadas
export async function authenticatedFetch(url: string, options: ApiOptions = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body && options.method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `Erro ${response.status}`);
  }

  return response.json();
}

// Hook para usar em componentes React
export function useAuthenticatedApi() {
  return {
    get: (url: string) => authenticatedFetch(url, { method: 'GET' }),
    post: (url: string, body: any) => authenticatedFetch(url, { method: 'POST', body }),
    put: (url: string, body: any) => authenticatedFetch(url, { method: 'PUT', body }),
    delete: (url: string) => authenticatedFetch(url, { method: 'DELETE' }),
  };
}