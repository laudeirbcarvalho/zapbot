import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// GET - Listar todos os leads
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;

    console.log('🔍 [API] Buscando leads no banco de dados...');
    
    // Filtro base
    const whereClause: any = {
      deletedAt: null,
    };

    // Adicionar filtro por tenantId se o usuário pertencer a um tenant específico
    if (user.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    
    // Filtrar baseado no tipo de usuário
    if (user.isSuperAdmin) {
      // Super Admin vê todos os leads
      console.log(`🔍 [API] Super Admin ${user.name} - Buscando todos os leads`);
    } else if (user.userType === 'ADMIN') {
      // Admin vê apenas leads de sua hierarquia (seus gerentes e atendentes)
      const managersFromAdmin = await prisma.user.findMany({
        where: {
          userType: 'MANAGER',
          adminId: user.id,
          isActive: true
        },
        select: {
          id: true
        }
      });
      
      const managerIds = managersFromAdmin.map(manager => manager.id);
      
      // Buscar atendentes deste admin (diretamente ou via gerentes)
      const teamAttendants = await prisma.attendant.findMany({
        where: {
          OR: [
            { adminId: user.id }, // Atendentes diretamente associados ao admin
            { 
              managerId: {
                in: managerIds // Atendentes dos gerentes deste admin
              }
            }
          ],
          isActive: true
        },
        select: {
          id: true
        }
      });
      
      const teamAttendantIds = teamAttendants.map(att => att.id);
      
      // Filtrar leads: da hierarquia do admin OU não atribuídos (mas do mesmo tenant)
      if (teamAttendantIds.length > 0) {
        whereClause.AND = [
          {
            OR: [
              {
                attendantId: {
                  in: teamAttendantIds
                }
              },
              {
                attendantId: null // Leads não atribuídos do mesmo tenant
              }
            ]
          }
        ];
      } else {
        // Se não tem atendentes, mostrar apenas leads não atribuídos do mesmo tenant
        whereClause.attendantId = null;
      }
      
      console.log(`🔍 [API] Admin ${user.name} - Filtrando leads da hierarquia (${managerIds.length} gerentes, ${teamAttendantIds.length} atendentes)`);
    } else if (user.userType === 'MANAGER') {
      // Gerente vê apenas leads da sua equipe
      const teamAttendants = await prisma.attendant.findMany({
        where: {
          managerId: user.id,
          isActive: true
        },
        select: {
          id: true
        }
      });
      
      const teamAttendantIds = teamAttendants.map(att => att.id);
      
      // Limpar qualquer OR clause anterior
      delete whereClause.OR;
      
      if (teamAttendantIds.length > 0) {
        // Filtrar leads apenas da equipe (sem leads não atribuídos)
        whereClause.attendantId = {
          in: teamAttendantIds
        };
      } else {
        // Se não tem atendentes, não vê nenhum lead
        whereClause.id = 'invalid'; // Força resultado vazio
      }
      
      console.log(`🔍 [API] Gerente ${user.name} - Filtrando leads da equipe (${teamAttendantIds.length} atendentes) - APENAS da equipe`);
    } else {
      console.log(`🔍 [API] Usuário ${user.name} - Sem permissão para ver leads`);
      whereClause.id = 'invalid'; // Força resultado vazio
    }
    
    const leads = await prisma.lead.findMany({
      where: whereClause,
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
        createdAt: 'desc',
      },
    });
    
    console.log('✅ [API] Leads encontrados:', leads.length);
    if (leads.length > 0) {
      console.log('👤 [API] Primeiro lead:', leads[0].name, 'ID:', leads[0].id);
    }
    
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leads" },
      { status: 500 }
    );
  }
});

// POST - Criar um novo lead
export const POST = withAuth(async (request: NextRequest) => {
  try {
    // Obter o usuário autenticado do contexto da requisição
    const user = (request as any).user;

    const { name, email, phone, source, status, columnId, notes, attendantId } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 }
      );
    }
    
    // Determinar o atendente a ser associado
    let finalAttendantId = null;
    
    if (attendantId) {
      // Se attendantId foi fornecido no formulário, usar ele
      console.log('🔍 [LEAD] Usando atendente do formulário:', attendantId);
      finalAttendantId = attendantId;
    } else {
      // Caso contrário, buscar o atendente correspondente ao usuário logado
      console.log('🔍 [LEAD] Buscando atendente para email:', user.email);
      const attendant = await prisma.attendant.findFirst({
        where: {
          email: user.email,
          isActive: true
        }
      });
      
      if (attendant) {
        console.log('✅ [LEAD] Atendente encontrado:', attendant.name, 'ID:', attendant.id);
        finalAttendantId = attendant.id;
      } else {
        console.log('❌ [LEAD] Nenhum atendente encontrado para o email:', user.email);
      }
    }
    
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || "",
        phone: phone || "",
        source: source || "Site",
        status: status,
        columnId: columnId || null,
        notes: notes || "",
        position: 0,
        createdBy: user.id, // Associar o usuário que criou o lead
        attendantId: finalAttendantId, // Usar o atendente determinado
        tenantId: user.tenantId, // Associar ao tenant do usuário
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
      }
    });
    
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    return NextResponse.json(
      { error: "Erro ao criar lead" },
      { status: 500 }
    );
  }
});