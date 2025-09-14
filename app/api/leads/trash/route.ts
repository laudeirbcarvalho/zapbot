import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Listar leads na lixeira
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const where: any = {
      deletedAt: { not: null }, // Apenas leads deletados
    };
    
    // Adicionar filtro por tenantId se o usuário pertencer a um tenant específico
    if (user.tenantId) {
      where.tenantId = user.tenantId;
    }
    
    // Se for gerente, filtrar apenas leads que ele próprio excluiu
    if (user.type === 'manager') {
      where.deletedBy = user.id; // Apenas leads excluídos pelo próprio gerente
    }
    // Administradores podem ver todos os leads na lixeira
    
    if (search && !where.AND) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Buscar leads deletados
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
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
        },
        orderBy: {
          deletedAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao buscar leads na lixeira:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar leads na lixeira' },
      { status: 500 }
    );
  }
});

// DELETE - Exclusão definitiva (apenas para admins)
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Verificar se é administrador
    if (user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir definitivamente' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('id');
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o lead existe na lixeira
    const existingLead = await prisma.lead.findUnique({
      where: {
        id: leadId,
        deletedAt: { not: null }
      }
    });
    
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead não encontrado na lixeira' },
        { status: 404 }
      );
    }
    
    // Exclusão definitiva
    await prisma.lead.delete({
      where: {
        id: leadId
      }
    });
    
    console.log(`🗑️ Lead ${leadId} excluído definitivamente por ${user.name} (${user.email})`);
    return NextResponse.json({ message: 'Lead excluído definitivamente' });
  } catch (error) {
    console.error('Erro ao excluir lead definitivamente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir lead definitivamente' },
      { status: 500 }
    );
  }
});