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
        const userData = localStorage.getItem('user');
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

    // Escutar mudanças no localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return authState;
}