import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/lib/auth-middleware';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// GET - Buscar atendente por ID
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const attendant = await prisma.attendant.findUnique({
      where: {
        id: params.id
      },
      include: {
        position: {
          select: {
            id: true,
            name: true
          }
        },
        function: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: 'Atendente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(attendant);
  } catch (error) {
    console.error('Erro ao buscar atendente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar atendente
export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json();
    const { name, email, password, phone, cpf, positionId, functionId, departmentId, managerId, startTime, endTime, workDays, isActive } = body;

    // Validações básicas
    if (!name || !email || !positionId || !functionId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, positionId, functionId, startTime, endTime' },
        { status: 400 }
      );
    }

    // Verificar se o email já existe em outro atendente
    const existingAttendant = await prisma.attendant.findFirst({
      where: {
        email,
        NOT: {
          id: params.id
        }
      }
    });

    if (existingAttendant) {
      return NextResponse.json(
        { error: 'Email já está em uso por outro atendente' },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      name,
      email,
      phone: phone || null,
      cpf: cpf || null,
      positionId,
      functionId,
      departmentId: departmentId || null,
      managerId: managerId || null,
      startTime,
      endTime,
      workDays: workDays || '',
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date()
    };

    // Se uma nova senha foi fornecida, fazer o hash
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Atualizar o atendente
    const updatedAttendant = await prisma.attendant.update({
      where: {
        id: params.id
      },
      data: updateData
    });

    return NextResponse.json(updatedAttendant);
  } catch (error) {
    console.error('Erro ao atualizar atendente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Excluir atendente
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Verificar se o atendente existe
    const attendant = await prisma.attendant.findUnique({
      where: {
        id: params.id
      }
    });

    if (!attendant) {
      return NextResponse.json(
        { error: 'Atendente não encontrado' },
        { status: 404 }
      );
    }

    // Excluir o atendente
    await prisma.attendant.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json(
      { message: 'Atendente excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir atendente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});