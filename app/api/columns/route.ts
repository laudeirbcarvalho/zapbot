import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Listar todas as colunas
export async function GET() {
  try {
    const columns = await prisma.column.findMany({
      orderBy: {
        position: 'asc',
      },
      include: {
        leads: true,
      },
    });
    
    return NextResponse.json(columns);
  } catch (error) {
    console.error("Erro ao buscar colunas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar colunas" },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova coluna
export async function POST(request: Request) {
  try {
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
}