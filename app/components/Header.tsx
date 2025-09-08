"use client";

import { useEffect, useState } from "react";
import { useTenant } from "../hooks/useTenant";

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
  const { tenant, settings } = useTenant();

  useEffect(() => {
    // Obter dados do usuário do localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
      }
    }
  }, []);

  const getUserTypeLabel = (userType: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) return 'Super Admin';
    return userType === 'ADMIN' ? 'Administrador' : 'Gerente';
  };

  const getUserTypeColor = (userType: string, isSuperAdmin: boolean = false) => {
    if (isSuperAdmin) return 'bg-red-500';
    return userType === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500';
  };

  const systemName = settings?.system_name || tenant?.name || 'ZapBot';
  const logoUrl = settings?.system_logo_url;

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