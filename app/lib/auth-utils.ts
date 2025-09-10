'use client';

/**
 * Utilitário para verificar autenticação de forma consistente
 * Aguarda o carregamento da autenticação antes de tentar acessar o token
 */
export function getAuthToken(isLoading: boolean): string | null {
  // Se ainda está carregando, retorna null para aguardar
  if (isLoading) {
    return null;
  }
  
  // Tenta obter o token do localStorage
  return localStorage.getItem('authToken');
}

/**
 * Verifica se o usuário está autenticado
 * Retorna true se autenticado, false se não autenticado, null se ainda carregando
 */
export function isAuthenticated(isLoading: boolean): boolean | null {
  if (isLoading) {
    return null; // Ainda carregando
  }
  
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
}

/**
 * Redireciona para login se não autenticado
 */
export function redirectToLoginIfNotAuth(isLoading: boolean): boolean {
  const authStatus = isAuthenticated(isLoading);
  
  if (authStatus === null) {
    return false; // Ainda carregando, não redirecionar
  }
  
  if (!authStatus) {
    window.location.href = '/login';
    return true; // Redirecionou
  }
  
  return false; // Autenticado, não precisa redirecionar
}