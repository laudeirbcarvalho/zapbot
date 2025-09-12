import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Listar todas as funções
export const GET = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;
    
    const whereClause: any = {
      isActive: true
    };
    
    // Removido filtro por tenantId - sistema single-tenant
    
    const functions = await prisma.function.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(functions);
  } catch (error) {
    console.error('Erro ao buscar funções:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar nova função
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

    // Verificar se já existe uma função com esse nome
    const existingFunction = await prisma.function.findUnique({
      where: { name }
    });

    if (existingFunction) {
      return NextResponse.json(
        { error: 'Já existe uma função com esse nome' },
        { status: 409 }
      );
    }

    const functionRecord = await prisma.function.create({
      data: {
        name,
        description
      }
    });

    return NextResponse.json(newFunction, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar função:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar função
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

    // Verificar se existe outra função com o mesmo nome
    const existingFunction = await prisma.function.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });

    if (existingFunction) {
      return NextResponse.json(
        { error: 'Já existe uma função com esse nome' },
        { status: 409 }
      );
    }

    const functionRecord = await prisma.function.update({
      where: { id },
      data: {
        name,
        description,
        isActive
      }
    });

    return NextResponse.json(updatedFunction);
  } catch (error) {
    console.error('Erro ao atualizar função:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Excluir função (soft delete)
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

    // Verificar se existem atendentes usando esta função
    const attendantsCount = await prisma.attendant.count({
      where: { functionId: id }
    });

    if (attendantsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma função que está sendo usada por atendentes' },
        { status: 409 }
      );
    }

    await prisma.function.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Função excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir função:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});