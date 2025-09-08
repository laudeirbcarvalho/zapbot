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

// Função para obter informações do tenant
function getTenantInfo(): { tenantId: string | null; tenantSlug: string | null } {
  if (typeof window === 'undefined') {
    return { tenantId: null, tenantSlug: null };
  }

  // Primeiro tenta obter das meta tags
  let tenantId = document.querySelector('meta[name="tenant-id"]')?.getAttribute('content');
  let tenantSlug = document.querySelector('meta[name="tenant-slug"]')?.getAttribute('content');
  
  // Se não encontrar nas meta tags, tenta obter do localStorage
  if (!tenantId || tenantId === '') {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        tenantId = user.tenantId;
      } catch (e) {
        console.warn('Erro ao parsear dados do usuário:', e);
      }
    }
  }

  // Se ainda não encontrou, usa o tenant padrão
  if (!tenantId || tenantId === '') {
    tenantId = '3e12a107-fdba-4f39-93fd-55a98c832c93'; // ID do tenant padrão ZAPBOT
    tenantSlug = 'localhost';
  }

  return { tenantId, tenantSlug };
}

// Função para fazer requisições autenticadas
export async function authenticatedFetch(url: string, options: ApiOptions = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  // Obter informações do tenant
  const { tenantId, tenantSlug } = getTenantInfo();
  const tenantHeaders: Record<string, string> = {};
  
  if (tenantId) tenantHeaders['X-Tenant-Id'] = tenantId;
  if (tenantSlug) tenantHeaders['X-Tenant-Slug'] = tenantSlug;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...tenantHeaders,
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

// Função para requisições públicas (sem autenticação)
export async function publicFetch(url: string, options: ApiOptions = {}) {
  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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