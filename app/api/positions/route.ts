import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Listar todas as posições ativas
export const GET = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;
    
    const whereClause: any = {
      isActive: true
    };
    
    // Removido filtro por tenantId - sistema single-tenant
    
    const positions = await prisma.position.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Erro ao buscar posições:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar nova posição
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma posição com esse nome
    const existingPosition = await prisma.position.findUnique({
      where: { name }
    });

    if (existingPosition) {
      return NextResponse.json(
        { error: 'Já existe uma posição com esse nome' },
        { status: 409 }
      );
    }

    const position = await prisma.position.create({
      data: {
        name,
        description
      }
    });

    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar posição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar posição
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se existe outra posição com o mesmo nome
    const existingPosition = await prisma.position.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });

    if (existingPosition) {
      return NextResponse.json(
        { error: 'Já existe uma posição com esse nome' },
        { status: 409 }
      );
    }

    const position = await prisma.position.update({
      where: { id },
      data: {
        name,
        description,
        isActive
      }
    });

    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error('Erro ao atualizar posição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Excluir posição (soft delete)
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se existem atendentes usando esta posição
    const attendantsCount = await prisma.attendant.count({
      where: { positionId: id }
    });

    if (attendantsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma posição que está sendo usada por atendentes' },
        { status: 409 }
      );
    }

    await prisma.position.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Posição excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir posição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});