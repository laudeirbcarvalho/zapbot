import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { title, position } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Título da coluna é obrigatório' },
        { status: 400 }
      );
    }

    // Criar nova coluna usando Prisma
    const newColumn = await prisma.column.create({
      data: {
        title: title.trim(),
        position: position || 0
      }
    });

    console.log(`📋 [Kanban] Nova coluna criada: ${title} (${newColumn.id})`);

    return NextResponse.json({
      success: true,
      column: newColumn
    });
  } catch (error) {
    console.error('❌ [Kanban] Erro ao criar coluna:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});