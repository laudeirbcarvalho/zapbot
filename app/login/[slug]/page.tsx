"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  isActive: boolean;
  settings: {
    system_name?: string;
    system_logo_url?: string;
  };
}

export default function TenantLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  // Carregar informações do tenant
  useEffect(() => {
    const loadTenantInfo = async () => {
      try {
        const response = await fetch(`/api/tenant/info/${slug}`);
        if (!response.ok) {
          throw new Error('Tenant não encontrado');
        }
        const data = await response.json();
        setTenantInfo(data.tenant);
      } catch (err) {
        console.error('Erro ao carregar tenant:', err);
        setError('Tenant não encontrado ou inativo');
      } finally {
        setTenantLoading(false);
      }
    };

    if (slug) {
      loadTenantInfo();
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Slug": slug, // Enviar slug do tenant
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.message || "Erro ao fazer login");
      }
    } catch (error) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage("");

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': slug,
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();
      setForgotPasswordMessage(data.message || 'Email de recuperação enviado!');
    } catch (error) {
      setForgotPasswordMessage('Erro ao enviar email de recuperação');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Loading do tenant
  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tenant não encontrado
  if (!tenantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Tenant não encontrado</h1>
          <p className="text-gray-300 mb-6">
            O tenant "{slug}" não foi encontrado ou está inativo.
          </p>
          <Link 
            href="/login" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition"
          >
            Voltar ao Login Principal
          </Link>
        </div>
      </div>
    );
  }

  // Tela de recuperação de senha
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          {tenantInfo.settings.system_logo_url && (
            <div className="text-center mb-4">
              <img 
                src={tenantInfo.settings.system_logo_url} 
                alt="Logo" 
                className="h-12 mx-auto"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            {tenantInfo.settings.system_name || tenantInfo.name}
          </h1>
          <h2 className="text-xl text-center text-gray-300 mb-6">Recuperar Senha</h2>
          
          {forgotPasswordMessage && (
            <div className="bg-blue-500 text-white p-3 rounded mb-4">
              {forgotPasswordMessage}
            </div>
          )}
          
          <form onSubmit={handleForgotPassword}>
            <div className="mb-4">
              <label htmlFor="forgotEmail" className="block text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite seu email"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={forgotPasswordLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition mb-4"
            >
              {forgotPasswordLoading ? "Enviando..." : "Enviar Link de Recuperação"}
            </button>
          </form>
          
          <button
            onClick={() => setShowForgotPassword(false)}
            className="w-full text-blue-400 hover:text-blue-300 text-sm"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          {/* Logo do tenant */}
          {tenantInfo.settings.system_logo_url && (
            <div className="text-center mb-4">
              <img 
                src={tenantInfo.settings.system_logo_url} 
                alt="Logo" 
                className="h-12 mx-auto"
              />
            </div>
          )}
          
          {/* Nome do sistema personalizado */}
          <h1 className="text-3xl font-bold text-center text-white mb-2">
            {tenantInfo.settings.system_name || tenantInfo.name}
          </h1>
          <h2 className="text-xl text-center text-gray-300 mb-6">
            Faça login para acessar o dashboard
          </h2>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}
        
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="block w-full text-blue-400 hover:text-blue-300 text-sm"
            >
              Esqueci minha senha
            </button>
            
            <Link 
              href="/login" 
              className="block text-gray-400 hover:text-gray-300 text-xs"
            >
              Voltar ao login principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}