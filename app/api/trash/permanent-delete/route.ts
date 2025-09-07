import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

// DELETE - Excluir permanentemente item da lixeira (apenas admin)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas administradores podem excluir permanentemente
    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir permanentemente" },
        { status: 403 }
      );
    }

    const { id, type } = await request.json();

    if (!id || !type || !['lead', 'column'].includes(type)) {
      return NextResponse.json(
        { error: "ID e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    if (type === 'lead') {
      // Verificar se o lead existe e está deletado
      const lead = await prisma.lead.findFirst({
        where: {
          id: id,
          deletedAt: { not: null },
        },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "Lead não encontrado na lixeira" },
          { status: 404 }
        );
      }

      // Excluir permanentemente o lead
      await prisma.lead.delete({
        where: { id: id },
      });

      return NextResponse.json({ message: "Lead excluído permanentemente" });
    } else if (type === 'column') {
      // Verificar se a coluna existe e está deletada
      const column = await prisma.column.findFirst({
        where: {
          id: id,
          deletedAt: { not: null },
        },
      });

      if (!column) {
        return NextResponse.json(
          { error: "Coluna não encontrada na lixeira" },
          { status: 404 }
        );
      }

      // Verificar se há leads associados (mesmo deletados)
      const associatedLeads = await prisma.lead.findMany({
        where: {
          columnId: id,
        },
      });

      if (associatedLeads.length > 0) {
        // Excluir permanentemente todos os leads associados primeiro
        await prisma.lead.deleteMany({
          where: {
            columnId: id,
          },
        });
      }

      // Excluir permanentemente a coluna
      await prisma.column.delete({
        where: { id: id },
      });

      return NextResponse.json({ 
        message: `Coluna e ${associatedLeads.length} leads associados excluídos permanentemente` 
      });
    }

    return NextResponse.json(
      { error: "Tipo inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao excluir permanentemente:", error);
    return NextResponse.json(
      { error: "Erro ao excluir permanentemente" },
      { status: 500 }
    );
  }
}