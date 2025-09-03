"use client";

import { useSession } from "next-auth/react";

export default function Header({ title }: { title: string }) {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-800 p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <div className="flex items-center">
        <div className="text-gray-300 mr-2">
          {session?.user?.name || "Usuário"}
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          {session?.user?.name?.[0] || "U"}
        </div>
      </div>
    </header>
  );
}