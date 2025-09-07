import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

// POST - Restaurar item da lixeira
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, type } = await request.json();

    if (!id || !type || !['lead', 'column'].includes(type)) {
      return NextResponse.json(
        { error: "ID e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    const isAdmin = session.user.userType === 'ADMIN';
    const userId = session.user.id;

    if (type === 'lead') {
      // Verificar se o lead existe e está deletado
      const lead = await prisma.lead.findFirst({
        where: {
          id: id,
          deletedAt: { not: null },
          ...(isAdmin ? {} : { userId: userId }), // Admin pode restaurar qualquer lead, usuário só os seus
        },
      });

      if (!lead) {
        return NextResponse.json(
          { error: "Lead não encontrado ou você não tem permissão para restaurá-lo" },
          { status: 404 }
        );
      }

      // Verificar se a coluna ainda existe (não foi deletada)
      if (lead.columnId) {
        const column = await prisma.column.findFirst({
          where: {
            id: lead.columnId,
            deletedAt: null, // Coluna deve estar ativa
          },
        });

        if (!column) {
          // Se a coluna foi deletada, colocar o lead na primeira coluna disponível
          const firstColumn = await prisma.column.findFirst({
            where: {
              deletedAt: null,
            },
            orderBy: {
              position: 'asc',
            },
          });

          if (!firstColumn) {
            return NextResponse.json(
              { error: "Não há colunas disponíveis para restaurar o lead" },
              { status: 400 }
            );
          }

          // Restaurar lead na primeira coluna disponível
          await prisma.lead.update({
            where: { id: id },
            data: {
              deletedAt: null,
              deletedBy: null,
              columnId: firstColumn.id,
            },
          });
        } else {
          // Restaurar lead na coluna original
          await prisma.lead.update({
            where: { id: id },
            data: {
              deletedAt: null,
              deletedBy: null,
            },
          });
        }
      } else {
        // Lead sem coluna, restaurar sem coluna
        await prisma.lead.update({
          where: { id: id },
          data: {
            deletedAt: null,
            deletedBy: null,
          },
        });
      }

      return NextResponse.json({ message: "Lead restaurado com sucesso" });
    } else if (type === 'column') {
      // Verificar se a coluna existe e está deletada
      const column = await prisma.column.findFirst({
        where: {
          id: id,
          deletedAt: { not: null },
          ...(isAdmin ? {} : { deletedBy: userId }), // Admin pode restaurar qualquer coluna, usuário só as que ele deletou
        },
      });

      if (!column) {
        return NextResponse.json(
          { error: "Coluna não encontrada ou você não tem permissão para restaurá-la" },
          { status: 404 }
        );
      }

      // Verificar se já existe uma coluna na mesma posição
      const existingColumn = await prisma.column.findFirst({
        where: {
          position: column.position,
          deletedAt: null,
        },
      });

      let newPosition = column.position;
      if (existingColumn) {
        // Encontrar a próxima posição disponível
        const lastColumn = await prisma.column.findFirst({
          where: {
            deletedAt: null,
          },
          orderBy: {
            position: 'desc',
          },
        });
        newPosition = lastColumn ? lastColumn.position + 1 : 0;
      }

      // Restaurar coluna
      await prisma.column.update({
        where: { id: id },
        data: {
          deletedAt: null,
          deletedBy: null,
          position: newPosition,
        },
      });

      // Restaurar leads associados que também estavam deletados
      await prisma.lead.updateMany({
        where: {
          columnId: id,
          deletedAt: { not: null },
        },
        data: {
          deletedAt: null,
          deletedBy: null,
        },
      });

      return NextResponse.json({ message: "Coluna e leads associados restaurados com sucesso" });
    }

    return NextResponse.json(
      { error: "Tipo inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao restaurar item:", error);
    return NextResponse.json(
      { error: "Erro ao restaurar item" },
      { status: 500 }
    );
  }
}