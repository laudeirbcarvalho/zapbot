import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from "@/app/lib/auth-middleware";

const prisma = new PrismaClient();

// GET - Listar todas as colunas
export const GET = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;

    console.log('🔍 [API] Buscando colunas no banco de dados...');
    const columns = await prisma.column.findMany({
      where: {
        deletedAt: null, // Apenas colunas não deletadas
      },
      orderBy: {
        position: 'asc',
      },
      include: {
        leads: {
          where: {
            deletedAt: null, // Apenas leads não deletados
          },
        },
      },
    });
    
    console.log('✅ [API] Colunas encontradas:', columns.length);
    if (columns.length > 0) {
      console.log('📋 [API] Primeira coluna:', columns[0].title, 'ID:', columns[0].id);
      console.log('👥 [API] Total de leads nas colunas:', columns.reduce((total, col) => total + col.leads.length, 0));
    }
    
    return NextResponse.json(columns);
  } catch (error) {
    console.error("Erro ao buscar colunas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar colunas" },
      { status: 500 }
    );
  }
});

// POST - Criar uma nova coluna
export const POST = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;
    
    // Apenas administradores podem criar colunas
    if (user.userType !== 'ADMIN') {
      return NextResponse.json({ error: "Apenas administradores podem criar colunas" }, { status: 403 });
    }

    const body = await request.json();
    
    const { title, position } = body;
    
    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }
    
    // Obter a última posição para adicionar a nova coluna no final
    let lastPosition = 0;
    const lastColumn = await prisma.column.findFirst({
      where: {
        deletedAt: null,
      },
      orderBy: {
        position: 'desc',
      },
    });
    
    if (lastColumn) {
      lastPosition = lastColumn.position + 1;
    }
    
    const column = await prisma.column.create({
      data: {
        title,
        position: position !== undefined ? position : lastPosition,
      },
    });
    
    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar coluna:", error);
    return NextResponse.json(
      { error: "Erro ao criar coluna" },
      { status: 500 }
    );
  }
});