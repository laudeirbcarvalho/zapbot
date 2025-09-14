import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// POST - Restaurar lead da lixeira
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    const { leadId } = await request.json();
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o lead existe na lixeira
    const whereClause: any = {
      id: leadId,
      deletedAt: { not: null }
    };
    
    // Adicionar filtro por tenantId se o usuário pertencer a um tenant específico
    if (user.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    
    const existingLead = await prisma.lead.findFirst({
      where: whereClause
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead não encontrado na lixeira' },
        { status: 404 }
      );
    }
    
    // Restaurar lead (remover marcação de deletado)
    const restoredLead = await prisma.lead.update({
      where: {
        id: leadId
      },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date()
      },
      include: {
        attendant: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        column: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });
    
    console.log(`♻️ Lead ${leadId} restaurado da lixeira por ${user.name} (${user.email})`);
    return NextResponse.json({
      message: 'Lead restaurado com sucesso',
      lead: restoredLead
    });
  } catch (error) {
    console.error('Erro ao restaurar lead:', error);
    return NextResponse.json(
      { error: 'Erro ao restaurar lead' },
      { status: 500 }
    );
  }
});