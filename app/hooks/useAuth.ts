'use client';

import { useState, useEffect } from 'react';

interface AuthState {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userId: string | null;
  userType: string | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAdmin: false,
    isSuperAdmin: false,
    userId: null,
    userType: null,
    isLoading: true
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Priorizar sessionStorage para suportar múltiplas sessões
        const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setAuthState({
            isAdmin: user.userType === 'ADMIN' || user.isSuperAdmin,
            isSuperAdmin: user.isSuperAdmin || false,
            userId: user.id,
            userType: user.userType,
            isLoading: false
          });
        } else {
          setAuthState({
            isAdmin: false,
            isSuperAdmin: false,
            userId: null,
            userType: null,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setAuthState({
          isAdmin: false,
          isSuperAdmin: false,
          userId: null,
          userType: null,
          isLoading: false
        });
      }
    };

    checkAuth();

    // Escutar mudanças no localStorage e sessionStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    // O evento 'storage' só funciona para localStorage entre abas
    // Para sessionStorage, precisamos verificar periodicamente ou usar outros métodos
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar mudanças periodicamente para sessionStorage
    const interval = setInterval(checkAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return authState;
}