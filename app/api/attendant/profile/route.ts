import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get("attendant-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Token de acesso não encontrado" },
        { status: 401 }
      );
    }

    let attendantId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
      attendantId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Verificar se o usuário existe e é um atendente
    const attendant = await prisma.user.findFirst({
      where: {
        id: attendantId,
        type: "attendant"
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: "Atendente não encontrado" },
        { status: 404 }
      );
    }

    // Obter dados do corpo da requisição
    const { name, phone, whatsapp, currentPassword, newPassword } = await request.json();

    // Validações básicas
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Dados para atualização
    const updateData: any = {
      name,
      phone,
      whatsapp
    };

    // Se uma nova senha foi fornecida, criptografá-la
    if (newPassword) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Atualizar o usuário no banco de dados
    const updatedAttendant = await prisma.user.update({
      where: { id: attendantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        type: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedAttendant);

  } catch (error) {
    console.error("Erro ao atualizar perfil do atendente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get("attendant-token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Token de acesso não encontrado" },
        { status: 401 }
      );
    }

    let attendantId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
      attendantId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Buscar dados do atendente
    const attendant = await prisma.user.findFirst({
      where: {
        id: attendantId,
        type: "attendant"
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        type: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: "Atendente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(attendant);

  } catch (error) {
    console.error("Erro ao buscar perfil do atendente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}