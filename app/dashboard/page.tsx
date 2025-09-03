"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../components/Header";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Header title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Leads Recentes</h2>
          <div className="text-3xl font-bold text-blue-400">0</div>
          <div className="text-gray-400 mt-2">Nenhum lead registrado</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Conversões</h2>
          <div className="text-3xl font-bold text-green-400">0%</div>
          <div className="text-gray-400 mt-2">Taxa de conversão</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Integrações</h2>
          <div className="text-3xl font-bold text-purple-400">0/4</div>
          <div className="text-gray-400 mt-2">Ativas</div>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Atividade Recente</h2>
        <div className="text-gray-400">
          Nenhuma atividade registrada
        </div>
      </div>
    </>
  );
}