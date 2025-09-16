"use client";

import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";

export default function DocumentosPage() {
  const { isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>('fluxo-banco');

  // Verificar se é Super Admin
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    router.push('/dashboard');
    return null;
  }

  const sections = [
    {
      id: 'fluxo-banco',
      name: 'Fluxo de Banco de dados',
      icon: '🗄️',
      description: 'Hierarquia e estrutura do banco de dados'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Documentos</h1>
        <p className="text-gray-600">Documentação técnica e fluxos do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu lateral */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seções</h2>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeSection === 'fluxo-banco' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">🗄️ Fluxo de Banco de dados</h2>
                  <p className="text-gray-600">Hierarquia e estrutura organizacional do sistema</p>
                </div>

                {/* Diagrama da Hierarquia */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hierarquia do Sistema</h3>
                    <p className="text-gray-600">Estrutura organizacional e fluxo de dados</p>
                  </div>

                  {/* Diagrama SVG */}
                  <div className="flex justify-center">
                    <svg width="800" height="600" viewBox="0 0 800 600" className="border border-gray-200 rounded-lg">
                      {/* Definições de gradientes e estilos */}
                      <defs>
                        <linearGradient id="superAdminGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#B91C1C" stopOpacity="1"/>
                        </linearGradient>
                        <linearGradient id="adminGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="1"/>
                        </linearGradient>
                        <linearGradient id="managerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#059669" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#047857" stopOpacity="1"/>
                        </linearGradient>
                        <linearGradient id="attendantGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#6D28D9" stopOpacity="1"/>
                        </linearGradient>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
                        </filter>
                      </defs>

                      {/* Super Admin */}
                      <g transform="translate(350, 50)">
                        <rect x="-80" y="-25" width="160" height="50" rx="25" fill="url(#superAdminGradient)" filter="url(#shadow)"/>
                        <text x="0" y="-5" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">👑 SUPER ADMIN</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="10">Controle Total</text>
                      </g>

                      {/* Linha do Super Admin para Admins */}
                      <line x1="400" y1="75" x2="400" y2="120" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                      {/* Admins */}
                      <g transform="translate(200, 150)">
                        <rect x="-70" y="-25" width="140" height="50" rx="20" fill="url(#adminGradient)" filter="url(#shadow)"/>
                        <text x="0" y="-5" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">🛡️ ADMIN</text>
                        <text x="0" y="8" textAnchor="middle" fill="white" fontSize="9">Gerencia Sistema</text>
                      </g>

                      <g transform="translate(600, 150)">
                        <rect x="-70" y="-25" width="140" height="50" rx="20" fill="url(#adminGradient)" filter="url(#shadow)"/>
                        <text x="0" y="-5" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">🛡️ ADMIN</text>
                        <text x="0" y="8" textAnchor="middle" fill="white" fontSize="9">Gerencia Sistema</text>
                      </g>

                      {/* Linhas do Super Admin para Admins */}
                      <line x1="400" y1="120" x2="200" y2="125" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="400" y1="120" x2="600" y2="125" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                      {/* Linhas dos Admins para Managers */}
                      <line x1="200" y1="175" x2="150" y2="220" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="200" y1="175" x2="250" y2="220" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="600" y1="175" x2="550" y2="220" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="600" y1="175" x2="650" y2="220" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                      {/* Managers */}
                      <g transform="translate(150, 250)">
                        <rect x="-60" y="-20" width="120" height="40" rx="15" fill="url(#managerGradient)" filter="url(#shadow)"/>
                        <text x="0" y="-3" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">👨‍💼 MANAGER</text>
                        <text x="0" y="8" textAnchor="middle" fill="white" fontSize="8">Gerencia Equipe</text>
                      </g>

                      <g transform="translate(250, 250)">
                        <rect x="-60" y="-20" width="120" height="40" rx="15" fill="url(#managerGradient)" filter="url(#shadow)"/>
                        <text x="0" y="-3" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">👨‍💼 MANAGER</text>
                        <text x="0" y="8" textAnchor="middle" fill="white" fontSize="8">Gerencia Equipe</text>
                      </g>

                      <g transform="translate(550, 250)">
                        <rect x="-60" y="-20" width="120" height="40" rx="15" fill="url(#managerGradient)" filter="url(#shadow)"/>
                        <text x="0" y="-3" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">👨‍💼 MANAGER</text>
                        <text x="0" y="8" textAnchor="middle" fill="white" fontSize="8">Gerencia Equipe</text>
                      </g>

                      <g transform="translate(650, 250)">
                        <rect x="-60" y="-20" width="120" height="40" rx="15" fill="url(#managerGradient)" filter="url(#shadow)"/>
                        <text x="0" y="-3" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">👨‍💼 MANAGER</text>
                        <text x="0" y="8" textAnchor="middle" fill="white" fontSize="8">Gerencia Equipe</text>
                      </g>

                      {/* Linhas dos Managers para Attendants */}
                      <line x1="150" y1="270" x2="100" y2="320" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="150" y1="270" x2="200" y2="320" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="250" y1="270" x2="300" y2="320" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="250" y1="270" x2="350" y2="320" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="550" y1="270" x2="500" y2="320" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="550" y1="270" x2="600" y2="320" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                      <line x1="650" y1="270" x2="700" y2="320" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                      {/* Attendants */}
                      <g transform="translate(100, 350)">
                        <rect x="-50" y="-15" width="100" height="30" rx="10" fill="url(#attendantGradient)" filter="url(#shadow)"/>
                        <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">👤 ATTENDANT</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="7">Atende Leads</text>
                      </g>

                      <g transform="translate(200, 350)">
                        <rect x="-50" y="-15" width="100" height="30" rx="10" fill="url(#attendantGradient)" filter="url(#shadow)"/>
                        <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">👤 ATTENDANT</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="7">Atende Leads</text>
                      </g>

                      <g transform="translate(300, 350)">
                        <rect x="-50" y="-15" width="100" height="30" rx="10" fill="url(#attendantGradient)" filter="url(#shadow)"/>
                        <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">👤 ATTENDANT</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="7">Atende Leads</text>
                      </g>

                      <g transform="translate(350, 350)">
                        <rect x="-50" y="-15" width="100" height="30" rx="10" fill="url(#attendantGradient)" filter="url(#shadow)"/>
                        <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">👤 ATTENDANT</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="7">Atende Leads</text>
                      </g>

                      <g transform="translate(500, 350)">
                        <rect x="-50" y="-15" width="100" height="30" rx="10" fill="url(#attendantGradient)" filter="url(#shadow)"/>
                        <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">👤 ATTENDANT</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="7">Atende Leads</text>
                      </g>

                      <g transform="translate(600, 350)">
                        <rect x="-50" y="-15" width="100" height="30" rx="10" fill="url(#attendantGradient)" filter="url(#shadow)"/>
                        <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">👤 ATTENDANT</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="7">Atende Leads</text>
                      </g>

                      <g transform="translate(700, 350)">
                        <rect x="-50" y="-15" width="100" height="30" rx="10" fill="url(#attendantGradient)" filter="url(#shadow)"/>
                        <text x="0" y="0" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">👤 ATTENDANT</text>
                        <text x="0" y="10" textAnchor="middle" fill="white" fontSize="7">Atende Leads</text>
                      </g>

                      {/* Setas */}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#374151"/>
                        </marker>
                      </defs>

                      {/* Leads (representação visual) */}
                      <g transform="translate(400, 450)">
                        <rect x="-100" y="-20" width="200" height="40" rx="20" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2"/>
                        <text x="0" y="-5" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">📋 LEADS</text>
                        <text x="0" y="8" textAnchor="middle" fill="#6B7280" fontSize="9">Gerenciados pelos Atendentes</text>
                      </g>

                      {/* Linhas dos Attendants para Leads */}
                      <line x1="100" y1="365" x2="320" y2="430" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="200" y1="365" x2="350" y2="430" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="300" y1="365" x2="380" y2="430" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="350" y1="365" x2="400" y2="430" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="500" y1="365" x2="420" y2="430" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="600" y1="365" x2="450" y2="430" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="700" y1="365" x2="480" y2="430" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>

                      {/* Legenda */}
                      <g transform="translate(50, 520)">
                        <text x="0" y="0" fill="#374151" fontSize="12" fontWeight="bold">Legenda:</text>
                        <line x1="0" y1="15" x2="20" y2="15" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                        <text x="25" y="18" fill="#6B7280" fontSize="10">Hierarquia de Comando</text>
                        <line x1="150" y1="15" x2="170" y2="15" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                        <text x="175" y="18" fill="#6B7280" fontSize="10">Gerenciamento de Leads</text>
                      </g>
                    </svg>
                  </div>

                  {/* Descrição detalhada */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">👑</span>
                        <h4 className="font-bold text-red-800">Super Admin</h4>
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Controle total do sistema</li>
                        <li>• Gerencia todos os admins</li>
                        <li>• Acesso a documentação</li>
                        <li>• Configurações globais</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">🛡️</span>
                        <h4 className="font-bold text-blue-800">Admin</h4>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Gerencia managers</li>
                        <li>• Controla usuários</li>
                        <li>• Acesso a integrações</li>
                        <li>• Configurações do sistema</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">👨‍💼</span>
                        <h4 className="font-bold text-green-800">Manager</h4>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Gerencia atendentes</li>
                        <li>• Supervisiona leads</li>
                        <li>• Relatórios de equipe</li>
                        <li>• Kanban e dashboard</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">👤</span>
                        <h4 className="font-bold text-purple-800">Attendant</h4>
                      </div>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Atende leads</li>
                        <li>• Registra atendimentos</li>
                        <li>• Atualiza status</li>
                        <li>• Movimenta kanban</li>
                      </ul>
                    </div>
                  </div>

                  {/* Fluxo de dados */}
                  <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">🔄 Fluxo de Dados</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-red-500 rounded-full mr-3"></span>
                        <strong>Super Admin</strong> cria e gerencia <strong>Admins</strong>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
                        <strong>Admins</strong> criam e gerenciam <strong>Managers</strong>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
                        <strong>Managers</strong> criam e gerenciam <strong>Attendants</strong>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-purple-500 rounded-full mr-3"></span>
                        <strong>Attendants</strong> são automaticamente associados ao <strong>Manager</strong> que os criou
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-gray-500 rounded-full mr-3"></span>
                        <strong>Leads</strong> são distribuídos entre <strong>Attendants</strong> pelos <strong>Managers</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}