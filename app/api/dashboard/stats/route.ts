import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    const isAdmin = user.userType === 'ADMIN';
    const isManager = user.userType === 'MANAGER';
    
    // Data ranges
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Base filter - filtrar por tenant e permissões de usuário
    let baseFilter: any = {};
    
    // Filtrar por tenant se não for Super Admin
    // Removido filtro por tenantId - sistema single-tenant
    
    if (!isAdmin) {
      if (isManager) {
        // Buscar IDs dos atendentes do gerente
        const attendants = await prisma.attendant.findMany({
          where: { managerId: user.id },
          select: { id: true, name: true }
        });
        const attendantIds = attendants.map(a => a.id);
        
        if (attendantIds.length > 0) {
          baseFilter = {
            ...baseFilter,
            OR: [
              { attendantId: { in: attendantIds } },
              { createdBy: user.id }
            ]
          };
        } else {
          // Se não tem atendentes, só mostra leads criados pelo próprio gerente
          baseFilter = {
            ...baseFilter,
            createdBy: user.id
          };
        }
        

      } else {
        // Atendente vê apenas seus próprios leads
        baseFilter = {
          ...baseFilter,
          OR: [
            { attendantId: user.id },
            { createdBy: user.id }
          ]
        };
      }
    }

    // Total de leads
    const totalLeads = await prisma.lead.count({
      where: baseFilter
    });

    // Leads por status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: baseFilter,
      _count: {
        id: true
      }
    });

    // Leads por coluna
    const columnStats = await prisma.column.findMany({
      select: {
        id: true,
        title: true,
        color: true,
        _count: {
          select: {
            leads: {
              where: baseFilter
            }
          }
        }
      }
    });

    // Leads ativos (não fechados)
    const activeLeads = await prisma.lead.count({
      where: {
        ...baseFilter,
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

    // Leads fechados/convertidos
    const closedLeads = await prisma.lead.count({
      where: {
        ...baseFilter,
        OR: [
          { status: 'closed' },
          { status: 'won' },
          { status: 'converted' }
        ]
      }
    });

    // Leads perdidos
    const lostLeads = await prisma.lead.count({
      where: {
        ...baseFilter,
        status: 'lost'
      }
    });

    // Novos leads desta semana
    const newLeadsThisWeek = await prisma.lead.count({
      where: {
        ...baseFilter,
        createdAt: {
          gte: startOfWeek
        }
      }
    });

    // Novos leads deste mês
    const newLeadsThisMonth = await prisma.lead.count({
      where: {
        ...baseFilter,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Leads urgentes (atualizados recentemente)
    const urgentLeads = await prisma.lead.findMany({
      where: {
        ...baseFilter,
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
        updatedAt: true,
        attendant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Atividade recente
    const recentActivity = await prisma.lead.findMany({
      where: baseFilter,
      select: {
        id: true,
        name: true,
        status: true,
        columnId: true,
        updatedAt: true,
        attendant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    // Estatísticas de atendentes (apenas para admin e manager)
    let attendantStats = [];
    if (isAdmin) {
      const attendants = await prisma.attendant.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              leads: true
            }
          }
        },
        take: 10
      });
      
      // Buscar contagem de atendimentos para cada atendente
      for (const attendant of attendants) {
        const attendancesCount = await prisma.attendance.count({
          where: {
            lead: {
              attendantId: attendant.id
            }
          }
        });
        attendant.attendancesCount = attendancesCount;
      }
      
      attendantStats = attendants;
    } else if (isManager) {
      // Gerente vê apenas seus atendentes
      const attendants = await prisma.attendant.findMany({
        where: {
          isActive: true,
          managerId: user.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              leads: true
            }
          }
        },
        take: 10
      });
      
      // Buscar contagem de atendimentos para cada atendente
      for (const attendant of attendants) {
        const attendancesCount = await prisma.attendance.count({
          where: {
            lead: {
              attendantId: attendant.id
            }
          }
        });
        attendant.attendancesCount = attendancesCount;
      }
      
      attendantStats = attendants;
    }

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
      columnStats: columnStats.map(column => ({
        columnId: column.id,
        columnTitle: column.title,
        columnColor: column.color || '#6B7280',
        count: column._count.leads
      })),
      urgentLeadsList: urgentLeads,
      recentActivity,
      attendantStats,
      userType: user.userType,
      userName: user.name
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});