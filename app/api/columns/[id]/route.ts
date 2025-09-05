import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Buscar uma coluna específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const column = await prisma.column.findUnique({
      where: {
        id: id,
      },
      include: {
        leads: true,
      },
    });
    
    if (!column) {
      return NextResponse.json(
        { error: "Coluna não encontrada" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(column);
  } catch (error) {
    console.error("Erro ao buscar coluna:", error);
    return NextResponse.json(
      { error: "Erro ao buscar coluna" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma coluna
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    const { title, position } = body;
    
    const column = await prisma.column.update({
      where: {
        id: id,
      },
      data: {
        title,
        position,
      },
    });
    
    return NextResponse.json(column);
  } catch (error) {
    console.error("Erro ao atualizar coluna:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar coluna" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir uma coluna
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Verificar se existem leads associados a esta coluna
    const leadsCount = await prisma.lead.count({
      where: {
        columnId: id,
      },
    });
    
    if (leadsCount > 0) {
      // Opção 1: Retornar erro se houver leads associados
      return NextResponse.json(
        { error: "Não é possível excluir uma coluna com leads associados" },
        { status: 400 }
      );
      
      // Opção 2: Remover a associação dos leads com esta coluna
      // await prisma.lead.updateMany({
      //   where: {
      //     columnId: id,
      //   },
      //   data: {
      //     columnId: null,
      //   },
      // });
    }
    
    await prisma.column.delete({
      where: {
        id: id,
      },
    });
    
    return NextResponse.json({ message: "Coluna excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir coluna:", error);
    return NextResponse.json(
      { error: "Erro ao excluir coluna" },
      { status: 500 }
    );
  }
}