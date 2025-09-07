import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

const prisma = new PrismaClient();

// GET - Listar itens na lixeira
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const isAdmin = session.user.userType === 'ADMIN';
    const userId = session.user.id;

    // Buscar leads deletados
    const deletedLeads = await prisma.lead.findMany({
      where: {
        deletedAt: { not: null },
        ...(isAdmin ? {} : { userId: userId }), // Admin vê todos, usuário só os seus
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        deletedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    // Buscar colunas deletadas
    const deletedColumns = await prisma.column.findMany({
      where: {
        deletedAt: { not: null },
        ...(isAdmin ? {} : { 
          // Para colunas, usuário só vê as que ele deletou
          deletedBy: userId 
        }),
      },
      include: {
        deletedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    // Formatar dados para o frontend
    const formattedLeads = deletedLeads.map(lead => ({
      id: lead.id,
      type: 'lead' as const,
      title: lead.name,
      deletedAt: lead.deletedAt,
      deletedBy: lead.deletedBy,
      deletedByName: lead.deletedByUser?.name,
      originalData: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        columnId: lead.columnId,
        userId: lead.userId,
        userName: lead.user?.name,
      },
    }));

    const formattedColumns = deletedColumns.map(column => ({
      id: column.id,
      type: 'column' as const,
      title: column.title,
      deletedAt: column.deletedAt,
      deletedBy: column.deletedBy,
      deletedByName: column.deletedByUser?.name,
      originalData: {
        title: column.title,
        position: column.position,
        color: column.color,
      },
    }));

    // Combinar e ordenar por data de exclusão
    const allDeletedItems = [...formattedLeads, ...formattedColumns]
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

    return NextResponse.json(allDeletedItems);
  } catch (error) {
    console.error("Erro ao buscar itens da lixeira:", error);
    return NextResponse.json(
      { error: "Erro ao buscar itens da lixeira" },
      { status: 500 }
    );
  }
}