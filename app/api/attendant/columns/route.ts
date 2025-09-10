import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAttendantAuth } from "@/app/lib/attendant-auth-middleware";

const prisma = new PrismaClient();

// GET - Listar colunas para atendente
export const GET = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    console.log('🔍 [ATTENDANT API] Buscando colunas para atendente:', attendant.name);
    
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
            attendantId: attendant.id, // Apenas leads do atendente logado
          },
        },
      },
    });
    
    console.log('✅ [ATTENDANT API] Colunas encontradas:', columns.length);
    console.log('👥 [ATTENDANT API] Total de leads do atendente:', columns.reduce((total, col) => total + col.leads.length, 0));
    
    return NextResponse.json(columns);
  } catch (error) {
    console.error("Erro ao buscar colunas para atendente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar colunas" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});