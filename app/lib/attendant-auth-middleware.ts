import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface AttendantPayload {
  id: string;
  email: string;
  name: string;
  type: string;
  position?: string;
  department?: string;
  photoUrl?: string;
}

// Middleware para verificar autenticação de atendente
export function withAttendantAuth(
  handler: (request: NextRequest, attendant: AttendantPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const token = request.cookies.get("attendant-token")?.value;

      if (!token) {
        return NextResponse.json(
          { error: "Token de autenticação não encontrado" },
          { status: 401 }
        );
      }

      // Verificar e decodificar token
      const decoded = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET || "fallback-secret"
      ) as AttendantPayload;

      if (decoded.type !== "attendant") {
        return NextResponse.json(
          { error: "Acesso não autorizado" },
          { status: 403 }
        );
      }

      // Chamar o handler com os dados do atendente
      return await handler(request, decoded);
    } catch (error) {
      console.error("Erro na autenticação do atendente:", error);
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }
  };
}

// Hook para usar no frontend
export function useAttendantAuth() {
  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/attendant/session", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.attendant;
      }
      return null;
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/attendant/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, attendant: data.attendant };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Erro no login:", error);
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/attendant/logout", {
        method: "POST",
        credentials: "include",
      });
      return true;
    } catch (error) {
      console.error("Erro no logout:", error);
      return false;
    }
  };

  return { checkSession, login, logout };
}