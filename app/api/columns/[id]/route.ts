import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from "@/app/lib/auth-middleware";

const prisma = new PrismaClient();

// GET - Buscar uma coluna específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = params.id;
    
    const column = await prisma.column.findUnique({
      where: {
        id: id,
        deletedAt: null, // Apenas colunas não deletadas
      },
      include: {
        leads: {
          where: {
            deletedAt: null, // Apenas leads não deletados
          },
        },
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
export const PUT = withAuth(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const user = (request as any).user;
    
    // Apenas administradores podem editar colunas
    if (user.userType !== 'ADMIN') {
      return NextResponse.json({ error: "Apenas administradores podem editar colunas" }, { status: 403 });
    }

    const id = params.id;
    const body = await request.json();
    
    const { title, position, color } = body;
    
    const column = await prisma.column.update({
      where: {
        id: id,
        deletedAt: null, // Apenas colunas não deletadas
      },
      data: {
        ...(title && { title }),
        ...(position !== undefined && { position }),
        ...(color && { color }),
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
});

// DELETE - Soft delete de uma coluna
export const DELETE = withAuth(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const user = (request as any).user;
    
    // Apenas administradores podem excluir colunas
    if (user.userType !== 'ADMIN') {
      return NextResponse.json({ error: "Apenas administradores podem excluir colunas" }, { status: 403 });
    }

    const id = params.id;
    
    // Verificar se existem leads não deletados associados a esta coluna
    const leadsCount = await prisma.lead.count({
      where: {
        columnId: id,
        deletedAt: null, // Apenas leads não deletados
      },
    });
    
    if (leadsCount > 0) {
      // Fazer soft delete dos leads associados também
      await prisma.lead.updateMany({
        where: {
          columnId: id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      });
    }
    
    // Soft delete da coluna
    await prisma.column.update({
      where: {
        id: id,
        deletedAt: null, // Apenas se não estiver já deletada
      },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });
    
    return NextResponse.json({ message: "Coluna movida para lixeira" });
  } catch (error) {
    console.error("Erro ao excluir coluna:", error);
    return NextResponse.json(
      { error: "Erro ao excluir coluna" },
      { status: 500 }
    );
  }
});