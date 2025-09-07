import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAttendantAuth } from '@/app/lib/attendant-auth-middleware';

const prisma = new PrismaClient();

export const GET = withAttendantAuth(async (request: NextRequest, attendant) => {
  try {

    // Buscar estatísticas dos leads do atendente
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const attendantId = attendant.id;
    
    // Total de leads do atendente
    const totalLeads = await prisma.lead.count({
      where: {
        attendantId: attendantId
      }
    });

    // Leads por status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        attendantId: attendantId
      },
      _count: {
        id: true
      }
    });

    // Leads por coluna do Kanban
    const leadsByColumn = await prisma.lead.groupBy({
      by: ['columnId'],
      where: {
        attendantId: attendantId
      },
      _count: {
        id: true
      }
    });

    // Buscar informações das colunas
    const columns = await prisma.column.findMany({
      select: {
        id: true,
        title: true,
        color: true
      }
    });

    // Mapear leads por coluna com informações da coluna
    const columnStats = leadsByColumn.map(item => {
      const column = columns.find(col => col.id === item.columnId);
      return {
        columnId: item.columnId,
        columnTitle: column?.title || 'Desconhecida',
        columnColor: column?.color || '#6B7280',
        count: item._count.id
      };
    });

    // Leads urgentes (leads atualizados recentemente)
    const urgentLeads = await prisma.lead.findMany({
      where: {
        attendantId: attendantId,
        NOT: {
          OR: [
            { status: 'closed' },
            { status: 'won' },
            { status: 'converted' },
            { status: 'lost' }
          ]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        columnId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Leads finalizados (status 'closed' ou 'won')
    const closedLeads = await prisma.lead.count({
      where: {
        attendantId: attendantId,
        OR: [
          { status: 'closed' },
          { status: 'won' },
          { status: 'converted' }
        ]
      }
    });

    // Leads novos esta semana
    const newLeadsThisWeek = await prisma.lead.count({
      where: {
        attendantId: attendantId,
        createdAt: {
          gte: startOfWeek
        }
      }
    });

    // Leads novos este mês
    const newLeadsThisMonth = await prisma.lead.count({
      where: {
        attendantId: attendantId,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Leads ativos (não finalizados)
    const activeLeads = await prisma.lead.count({
      where: {
        attendantId: attendantId,
        NOT: {
          OR: [
            { status: 'closed' },
            { status: 'won' },
            { status: 'converted' },
            { status: 'lost' }
          ]
        }
      }
    });

    // Leads perdidos
    const lostLeads = await prisma.lead.count({
      where: {
        attendantId: attendantId,
        status: 'lost'
      }
    });

    // Atividade recente (últimos 5 leads atualizados)
    const recentActivity = await prisma.lead.findMany({
      where: {
        attendantId: attendantId
      },
      select: {
        id: true,
        name: true,
        status: true,
        columnId: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const stats = {
      totalLeads,
      activeLeads,
      closedLeads,
      lostLeads,
      urgentLeads: urgentLeads.length,
      newLeadsThisWeek,
      newLeadsThisMonth,
      leadsByStatus: leadsByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      columnStats,
      urgentLeadsList: urgentLeads,
      recentActivity
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Erro ao buscar estatísticas do atendente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});