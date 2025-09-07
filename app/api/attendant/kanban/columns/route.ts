import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAttendantAuth } from '@/app/lib/attendant-auth-middleware';

const prisma = new PrismaClient();

// GET - Listar colunas do Kanban para atendentes
export const GET = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {
    console.log('🔍 [API Attendant] Buscando colunas do Kanban para atendente:', attendant.name);
    
    // Buscar todas as colunas com seus leads
    const columns = await prisma.column.findMany({
      include: {
        leads: {
          where: {
            deletedAt: null,
            OR: [
              { attendantId: attendant.id }, // Leads atribuídos ao atendente
              { attendantId: null } // Leads não atribuídos
            ]
          },
          include: {
            attendant: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
                department: true,
                isActive: true
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });
    
    console.log('✅ [API Attendant] Colunas encontradas:', columns.length);
    
    return NextResponse.json(columns);
  } catch (error) {
    console.error("Erro ao buscar colunas do Kanban para atendente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar colunas" },
      { status: 500 }
    );
  }
});