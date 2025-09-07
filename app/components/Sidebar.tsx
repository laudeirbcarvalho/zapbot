"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊", adminOnly: false },
  { name: "Leads", href: "/dashboard/leads", icon: "👥", adminOnly: false },
  { name: "Kanban", href: "/dashboard/kanban", icon: "📋", adminOnly: false },
  { name: "Atendentes", href: "/dashboard/attendants", icon: "👨‍💼", adminOnly: false },
  { name: "Gerentes", href: "/dashboard/usuarios", icon: "👤", adminOnly: true },
  { name: "Lixeira", href: "/dashboard/lixeira", icon: "🗑️", adminOnly: false },
  { name: "Integrações", href: "/dashboard/integracoes", icon: "🔄", adminOnly: true },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: "⚙️", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 p-4">
      <div className="flex items-center justify-center py-4">
        <h1 className="text-2xl font-bold">ZapBot</h1>
      </div>
      
      <div className="mt-8 flex-1">
        <nav className="space-y-2">
          {navigation
            .filter((item) => !item.adminOnly || isAdmin)
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