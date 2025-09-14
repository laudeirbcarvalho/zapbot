"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../contexts/SettingsContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊", adminOnly: false, superAdminOnly: false },
  { name: "Leads", href: "/dashboard/leads", icon: "👥", adminOnly: false, superAdminOnly: false },
  { name: "Kanban", href: "/dashboard/kanban", icon: "📋", adminOnly: false, superAdminOnly: false },
  { name: "Atendentes", href: "/dashboard/attendants", icon: "👨‍💼", adminOnly: false, superAdminOnly: false },
  { name: "Usuários", href: "/dashboard/usuarios", icon: "👤", adminOnly: true, superAdminOnly: false },
  { name: "Lixeira", href: "/dashboard/lixeira", icon: "🗑️", adminOnly: false, superAdminOnly: false },
  { name: "Integrações", href: "/dashboard/integracoes", icon: "🔄", adminOnly: true, superAdminOnly: true },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: "⚙️", adminOnly: true, superAdminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { settings } = useSettings();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const logoUrl = null; // Logo será configurado via sistema de configurações

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 p-4">
      <div className="flex flex-col items-center justify-center py-4">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-10 w-auto mb-2"
          />
        )}
        <h1 className="text-2xl font-bold text-center">{settings.nomeEmpresa}</h1>
      </div>
      
      <div className="mt-8 flex-1">
        <nav className="space-y-2">
          {navigation
            .filter((item) => {
              if (item.superAdminOnly) return isSuperAdmin;
              if (item.adminOnly) return isAdmin;
              return true;
            })
            .map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors ${
                  pathname === item.href ? "bg-gray-800 text-blue-400" : "text-gray-300"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))
          }
        </nav>
      </div>
      
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="mr-3">🚪</span>
          Sair
        </button>
      </div>
    </div>
  );
}