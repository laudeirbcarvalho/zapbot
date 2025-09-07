import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Listar todos os departamentos
export const GET = withAuth(async () => {
  try {
    const departments = await prisma.department.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar novo departamento
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

    // Verificar se já existe um departamento com esse nome
    const existingDepartment = await prisma.department.findUnique({
      where: { name }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Já existe um departamento com esse nome' },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        description
      }
    });

    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar departamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// PUT - Atualizar departamento
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

    // Verificar se existe outro departamento com o mesmo nome
    const existingDepartment = await prisma.department.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Já existe um departamento com esse nome' },
        { status: 409 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        description,
        isActive
      }
    });

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Excluir departamento (soft delete)
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

    // Verificar se existem atendentes usando este departamento
    const attendantsCount = await prisma.attendant.count({
      where: { departmentId: id }
    });

    if (attendantsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um departamento que está sendo usado por atendentes' },
        { status: 409 }
      );
    }

    await prisma.department.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Departamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir departamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});