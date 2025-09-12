"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'ADMIN' | 'MANAGER';
  isSuperAdmin: boolean;
  isActive: boolean;
}

export default function Header({ title }: { title: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Função para carregar dados do usuário
    const loadUserData = () => {
      // Priorizar sessionStorage para sessões independentes por aba
      const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('👤 Header: Dados do usuário carregados:', parsedUser);
        } catch (error) {
          console.error('Erro ao parsear dados do usuário:', error);
        }
      } else {
        setUser(null);
      }
    };

    // Carregar dados iniciais
    loadUserData();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        console.log('🔄 Header: Detectada mudança nos dados do usuário');
        loadUserData();
      }
    };

    // Escutar eventos customizados para mudanças no localStorage
    const handleUserUpdate = () => {
      console.log('🔄 Header: Evento de atualização do usuário detectado');
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const getUserTypeLabel = (userType: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) return 'Super Admin';
    return userType === 'ADMIN' ? 'Administrador' : 'Gerente';
  };

  const getUserTypeColor = (userType: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) return 'bg-red-500';
    return userType === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500';
  };

  const systemName = 'ZapBot CRM';
  const logoUrl = null; // Logo será configurado via sistema de configurações

  return (
    <header className="bg-gray-800 p-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-8 w-auto"
          />
        )}
        <div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <div className="text-xs text-gray-400">{systemName}</div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-white font-medium">
            {user?.name || "Gerente"}
          </div>
          <div className="text-gray-300 text-sm">
            {user?.userType ? getUserTypeLabel(user.userType, user.isSuperAdmin) : "Gerente"}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full ${user?.userType ? getUserTypeColor(user.userType, user.isSuperAdmin) : 'bg-blue-500'} flex items-center justify-center text-white font-semibold`}>
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}