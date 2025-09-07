import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// GET - Verificar sessão do atendente
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("attendant-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 401 }
      );
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || "fallback-secret"
    ) as any;

    if (decoded.type !== "attendant") {
      return NextResponse.json(
        { error: "Token inválido para atendente" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      attendant: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        position: decoded.position,
        department: decoded.department,
        type: "attendant",
      },
    });
  } catch (error) {
    console.error("Erro ao verificar sessão do atendente:", error);
    return NextResponse.json(
      { error: "Token inválido" },
      { status: 401 }
    );
  }
}