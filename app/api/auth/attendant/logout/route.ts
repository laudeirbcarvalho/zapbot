import { NextResponse, NextRequest } from "next/server";

// POST - Logout do atendente
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    });

    // Remover cookie do token
    response.cookies.set("attendant-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no logout do atendente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}