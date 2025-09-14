import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from "@/app/lib/auth-middleware";

const prisma = new PrismaClient();

// GET - Buscar dados completos do Kanban
export const GET = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;
    
    // Verificar tipo de usuário
    const isAdmin = user.userType === 'ADMIN';
    const isManager = user.userType === 'MANAGER';
    const isAttendant = user.userType === 'ATTENDANT';
    
    // Definir filtro base para leads baseado no tipo de usuário
    let leadsFilter: any = {
      deletedAt: null, // Apenas leads não deletados
    };
    
    // Adicionar filtro por tenantId se o usuário pertencer a um tenant específico
    if (user.tenantId) {
      leadsFilter.tenantId = user.tenantId;
    }
    
    if (isAdmin) {
      // Administrador vê apenas leads criados por ele ou seus gerentes/atendentes
      const managedUsers = await prisma.user.findMany({
        where: { adminId: user.id },
        select: { id: true }
      });
      const managedUserIds = managedUsers.map(u => u.id);
      
      // Buscar atendentes dos gerentes gerenciados
      const managedAttendants = await prisma.attendant.findMany({
        where: { 
          OR: [
            { adminId: user.id },
            { managerId: { in: managedUserIds } }
          ],
          tenantId: user.tenantId // Filtrar por tenant
        },
        select: { id: true }
      });
      const managedAttendantIds = managedAttendants.map(a => a.id);
      
      leadsFilter.OR = [
        { createdBy: user.id }, // Leads criados pelo próprio admin
        { createdBy: { in: managedUserIds } }, // Leads criados pelos gerentes
        { attendantId: { in: managedAttendantIds } } // Leads dos atendentes
      ];
    } else if (isManager) {
      // Gerente vê apenas leads de seus atendentes
      const attendants = await prisma.attendant.findMany({
        where: { 
          managerId: user.id,
          tenantId: user.tenantId // Filtrar por tenant
        },
        select: { id: true }
      });
      const attendantIds = attendants.map(a => a.id);
      
      if (attendantIds.length > 0) {
        leadsFilter.OR = [
          { attendantId: { in: attendantIds } },
          { createdBy: user.id } // Leads criados pelo próprio gerente
        ];
      } else {
        leadsFilter.createdBy = user.id; // Se não tem atendentes, vê apenas os próprios
      }
    } else if (isAttendant) {
      // Atendente vê apenas seus próprios leads
      leadsFilter.attendantId = user.id;
    }

    // Definir filtro para colunas
    let columnsFilter: any = {
      deletedAt: null, // Apenas colunas não deletadas
    };
    
    // Removido filtro por tenantId - sistema single-tenant
    
    const columns = await prisma.column.findMany({
      where: columnsFilter,
      include: {
        leads: {
          where: leadsFilter,
          include: {
            attendant: true, // Incluir dados do atendente
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    // Buscar leads sem coluna (órfãos) que não estão deletados
    const orphanLeads = await prisma.lead.findMany({
      where: {
        ...leadsFilter,
        columnId: null,
      },
      include: {
        attendant: true, // Incluir dados do atendente
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('📊 [Kanban] Dados carregados -', columns.length, 'colunas,', 
      columns.reduce((total, col) => total + col.leads.length, 0), 'leads,',
      orphanLeads.length, 'leads órfãos');

    return NextResponse.json({
      columns,
      orphanLeads,
      stats: {
        totalColumns: columns.length,
        totalLeads: columns.reduce((total, col) => total + col.leads.length, 0) + orphanLeads.length,
        orphanLeads: orphanLeads.length,
      },
    });
  } catch (error) {
    console.error('❌ [Kanban] Erro ao carregar dados:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Erro ao carregar dados do Kanban" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
});