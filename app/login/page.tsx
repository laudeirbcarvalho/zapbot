"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";


export default function LoginPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Credenciais inválidas");
        setLoading(false);
        return;
      }

      // Salvar token no localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push("/dashboard");
    } catch (error) {
      setError("Ocorreu um erro ao fazer login");
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

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-3xl font-bold text-center text-white">
              {settings.nomeEmpresa}
            </h1>
          </div>
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
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-3xl font-bold text-center text-white">
              {settings.nomeEmpresa}
            </h1>
          </div>
          <h2 className="text-xl text-center text-gray-300 mb-6">Faça login para acessar o dashboard</h2>
          
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
        
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}