import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from '@/app/lib/auth-middleware';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// POST - Gerar token de acesso direto para atendente
export const POST = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;
    
    // Verificar se o usuário é administrador ou gerente
    if (user.userType !== 'ADMIN' && user.userType !== 'MANAGER') {
      return NextResponse.json(
        { error: "Apenas administradores e gerentes podem acessar contas de atendentes" },
        { status: 403 }
      );
    }

    const { attendantId } = await request.json();

    if (!attendantId) {
      return NextResponse.json(
        { error: "ID do atendente é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o atendente existe e está ativo
    const attendant = await prisma.attendant.findUnique({
      where: { 
        id: attendantId,
        isActive: true
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: "Atendente não encontrado ou inativo" },
        { status: 404 }
      );
    }

    // Se for gerente, verificar se o atendente pertence a ele
    if (user.userType === 'MANAGER' && attendant.managerId !== user.id) {
      return NextResponse.json(
        { error: "Você só pode acessar atendentes da sua equipe" },
        { status: 403 }
      );
    }

    // Gerar token JWT para o atendente
    const token = jwt.sign(
      {
        attendantId: attendant.id,
        name: attendant.name,
        email: attendant.email,
        userType: 'attendant'
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '24h' }
    );

    console.log('✅ [API] Token de acesso direto gerado para atendente:', attendant.name);

    return NextResponse.json({
      message: "Token gerado com sucesso",
      token,
      attendant: {
        id: attendant.id,
        name: attendant.name,
        email: attendant.email
      }
    });
  } catch (error) {
    console.error('❌ [API] Erro ao gerar token de acesso direto:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Erro ao gerar token de acesso" },
      { status: 500 }
    );
  }
});