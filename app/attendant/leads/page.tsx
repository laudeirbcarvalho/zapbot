"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAttendantAuth } from "@/app/lib/attendant-auth-middleware";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  columnId: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  attendantId?: string;
  attendant?: {
    id: string;
    name: string;
    email: string;
    position: string;
    department?: string;
    isActive: boolean;
  };
}

interface Column {
  id: string;
  title: string;
  position: number;
  color?: string;
}

interface AttendantData {
  id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  type: string;
}

export default function AttendantLeadsPage() {
  const [attendant, setAttendant] = useState<AttendantData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { checkSession, logout } = useAttendantAuth();

  useEffect(() => {
    const verifySessionAndFetchData = async () => {
      const attendantData = await checkSession();
      if (attendantData) {
        setAttendant(attendantData);
        await fetchLeads();
        await fetchColumns();
      } else {
        router.push("/attendant/login");
      }
      setLoading(false);
    };
    verifySessionAndFetchData();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/attendant/leads", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        setError("Erro ao carregar leads");
      }
    } catch (err) {
      setError("Erro ao carregar leads");
    }
  };

  const fetchColumns = async () => {
    try {
      const response = await fetch("/api/attendant/columns", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setColumns(data);
      }
    } catch (err) {
      console.error("Erro ao carregar colunas:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/attendant/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!attendant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/attendant/dashboard")}
                className="text-gray-400 hover:text-white"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-semibold text-white">Meus Leads</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                <span className="font-medium">{attendant.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Tabela de Leads */}
          <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-white">
                Lista de Leads
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                Leads atribuídos a você ou não atribuídos
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Origem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Atendente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                        Nenhum lead encontrado.
                      </td>
                    </tr>
                  ) : (
                    leads
                      .filter(lead => 
                        !lead.attendantId || lead.attendantId === attendant.id
                      )
                      .map((lead) => {
                        const column = columns.find(col => col.id === lead.columnId);
                        const backgroundColor = column?.color ? `${column.color}20` : 'transparent';
                        const borderColor = column?.color || 'transparent';
                        
                        return (
                          <tr 
                            key={lead.id} 
                            className="hover:bg-gray-700" 
                            style={{ 
                              backgroundColor, 
                              borderLeft: `4px solid ${borderColor}` 
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{lead.source}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                lead.status === "novo" ? "bg-blue-900 text-blue-200" :
                                lead.status === "em-contato" ? "bg-yellow-900 text-yellow-200" :
                                lead.status === "qualificado" ? "bg-purple-900 text-purple-200" :
                                lead.status === "negociacao" ? "bg-orange-900 text-orange-200" :
                                "bg-green-900 text-green-200"
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                              {lead.attendant ? lead.attendant.name : 'Não atribuído'}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}