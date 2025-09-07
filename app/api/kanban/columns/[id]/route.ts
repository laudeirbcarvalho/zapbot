import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const resolvedParams = await params;
    const columnId = resolvedParams.id;
    const { title } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: { title: title.trim() },
    });

    return NextResponse.json(updatedColumn);
  } catch (error) {
    console.error('❌ [Kanban] Erro ao atualizar coluna:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});

export const DELETE = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const resolvedParams = await params;
    const columnId = resolvedParams.id;

    const leadsCount = await prisma.lead.count({
      where: { columnId: columnId }
    });

    if (leadsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir uma coluna que contém leads',
          hasLeads: true,
          leadsCount: leadsCount
        },
        { status: 400 }
      );
    }

    await prisma.column.delete({
      where: { id: columnId }
    });

    return NextResponse.json(
      { message: 'Coluna excluída com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [Kanban] Erro ao excluir coluna:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});