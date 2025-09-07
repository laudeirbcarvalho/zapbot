"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAttendantAuth } from "@/app/lib/attendant-auth-middleware";
import { Eye, EyeOff, User, Lock, Save, ArrowLeft } from "lucide-react";

interface AttendantData {
  id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
  phone?: string;
  type: string;
}

export default function AttendantProfilePage() {
  const [attendant, setAttendant] = useState<AttendantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { checkSession, logout } = useAttendantAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const verifySessionAndFetchData = async () => {
      const attendantData = await checkSession();
      if (attendantData) {
        setAttendant(attendantData);
        setFormData({
          name: attendantData.name || "",
          phone: attendantData.phone || "",
          whatsapp: attendantData.whatsapp || "",
          password: "",
          confirmPassword: ""
        });
      } else {
        router.push("/attendant/login");
      }
      setLoading(false);
    };
    verifySessionAndFetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Validações
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      setSaving(false);
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      setSaving(false);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setSaving(false);
      return;
    }

    try {
      const updateData: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim()
      };

      // Só incluir senha se foi preenchida
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/attendant/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedAttendant = await response.json();
        setAttendant(updatedAttendant);
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        setSuccess("Perfil atualizado com sucesso!");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao atualizar perfil");
      }
    } catch (err) {
      setError("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
          <p className="text-gray-400">Gerencie suas informações pessoais e senha</p>
        </div>

        {/* Formulário */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informações Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Email (somente leitura) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={attendant?.email || ""}
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            {/* Alterar Senha */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Alterar Senha
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nova Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      placeholder="Deixe em branco para não alterar"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      placeholder="Confirme a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                A senha deve ter pelo menos 6 caracteres. Deixe em branco se não quiser alterar.
              </p>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}