import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// POST - Login do atendente
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const attendant = await prisma.attendant.findFirst({
      where: {
        email,
        isActive: true,
        canLogin: true
      },
      include: {
        position: true,
        department: true,
        function: true
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    if (!attendant.password) {
      return NextResponse.json(
        { error: "Atendente não possui senha configurada" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, attendant.password);
    
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Senha inválida');
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: attendant.id,
        email: attendant.email,
        name: attendant.name,
        type: "attendant",
        position: attendant.position?.name,
        department: attendant.department?.name,
        photoUrl: attendant.photoUrl,
      },
      process.env.NEXTAUTH_SECRET || "fallback-secret",
      { expiresIn: "8h" }
    );

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      attendant: {
        id: attendant.id,
        name: attendant.name,
        email: attendant.email,
        position: attendant.position?.name,
        department: attendant.department?.name,
        photoUrl: attendant.photoUrl,
        type: "attendant",
      },
    });

    // Definir cookie com token
    response.cookies.set("attendant-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 horas
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no login do atendente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}