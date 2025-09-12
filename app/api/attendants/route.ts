import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAuth } from "@/app/lib/auth-middleware";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// GET - Listar todos os atendentes
export const GET = withAuth(async (request: Request) => {
  try {
    const user = (request as any).user;
    const url = new URL(request.url);
    const managerId = url.searchParams.get('managerId');
    
    console.log('🔍 [API] Buscando atendentes no banco de dados...', managerId ? `para gerente ${managerId}` : '');
    
    const whereClause: any = {
      isActive: true
    };
    
    // Removido filtro por tenantId - sistema single-tenant
    
    // Filtrar baseado no tipo de usuário
    if (user.isSuperAdmin) {
      // Super Admin vê todos os atendentes
      if (managerId) {
        whereClause.managerId = managerId;
      }
    } else if (user.userType === 'ADMIN') {
      // Admin vê apenas atendentes associados a ele (diretamente ou via gerentes)
      if (managerId) {
        // Verificar se o gerente pertence a este admin
        const manager = await prisma.user.findFirst({
          where: {
            id: managerId,
            userType: 'MANAGER',
            adminId: user.id,
            isActive: true
          }
        });
        
        if (manager) {
          whereClause.managerId = managerId;
        } else {
          // Gerente não pertence a este admin, retornar vazio
          whereClause.managerId = 'invalid';
        }
      } else {
        // Filtrar por atendentes associados diretamente ao admin ou via seus gerentes
        whereClause.OR = [
          { adminId: user.id }, // Atendentes diretamente associados ao admin
          { 
            manager: {
              adminId: user.id // Atendentes de gerentes deste admin
            }
          }
        ];
      }
    } else if (user.userType === 'MANAGER') {
      // Gerente vê apenas seus próprios atendentes
      whereClause.managerId = user.id;
    } else {
      // Outros tipos não podem ver atendentes
      whereClause.managerId = 'invalid';
    }
    
    const attendants = await prisma.Attendant.findMany({
      where: whereClause,
      include: {
        position: {
          select: {
            id: true,
            name: true
          }
        },
        function: {
          select: {
            id: true,
            name: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        leads: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        ratings: {
          select: {
            score: true,
            type: true,
            comment: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Últimas 5 avaliações
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calcular estatísticas para cada atendente
    const attendantsWithStats = attendants.map(attendant => {
      const totalRatings = attendant.ratings.length;
      const averageScore = totalRatings > 0 
        ? attendant.ratings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings
        : 0;
      
      const ratingsByType = {
        elogios: attendant.ratings.filter(r => r.type === 'elogio').length,
        criticas: attendant.ratings.filter(r => r.type === 'critica').length,
        avaliacoes: attendant.ratings.filter(r => r.type === 'avaliacao').length
      };

      return {
        ...attendant,
        stats: {
          totalLeads: attendant.leads.length,
          totalRatings,
          averageScore: Math.round(averageScore * 10) / 10,
          ratingsByType
        }
      };
    });

    console.log(`✅ [API] Atendentes encontrados: ${attendantsWithStats.length}`);
    if (attendantsWithStats.length > 0) {
      console.log(`👤 [API] Primeiro atendente: ${attendantsWithStats[0].name} ID: ${attendantsWithStats[0].id}`);
    }

    return NextResponse.json(attendantsWithStats);
  } catch (error) {
    console.error('❌ [API] Erro ao buscar atendentes:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Erro ao buscar atendentes" },
      { status: 500 }
    );
  }
});

// POST - Criar novo atendente
export const POST = withAuth(async (request: Request) => {
  try {
    const { name, email, password, phone, cpf, positionId, functionId, department, managerId, startTime, endTime, workDays } = await request.json();

    if (!name || !email || !password || !positionId || !functionId || !startTime || !endTime || !workDays) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, email, password, positionId, functionId, startTime, endTime, workDays" },
        { status: 400 }
      );
    }

    console.log('📝 [API] Criando novo atendente:', name, managerId ? `com gerente ${managerId}` : 'sem gerente');

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const attendant = await prisma.attendant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        cpf,
        positionId,
        functionId,
        departmentId: department,
        managerId: managerId || null,
        startTime,
        endTime,
        workDays,
        isActive: true,
        canLogin: true
      }
    });

    console.log('✅ [API] Atendente criado com sucesso:', attendant.id);

    return NextResponse.json(attendant, { status: 201 });
  } catch (error) {
    console.error('❌ [API] Erro ao criar atendente:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "Email ou CPF já cadastrado" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Erro ao criar atendente" },
      { status: 500 }
    );
  }
});