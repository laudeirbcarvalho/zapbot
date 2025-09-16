import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();



// GET - Listar todos os usuários
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const currentUser = (request as any).user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    // Removido filtro por tenantId - sistema single-tenant
    
    // Filtrar baseado no tipo de usuário logado
    if (currentUser.isSuperAdmin) {
      // Super Admin pode ver todos os usuários
      // Não adiciona filtro adicional
    } else if (currentUser.userType === 'ADMIN') {
      // Administradores podem ver apenas seus gerentes e a si mesmos
      where.OR = [
        { 
          userType: 'MANAGER',
          adminId: currentUser.id // Apenas gerentes associados a este admin
        },
        { id: currentUser.id } // E a si mesmo
      ];
    } else if (currentUser.userType === 'MANAGER') {
      // Gerentes podem ver apenas a si mesmos
      where.id = currentUser.id;
    } else {
      // Outros tipos não deveriam acessar esta API
      where.id = currentUser.id;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Se um userType específico foi solicitado, aplicar apenas se permitido
    if (userType) {
      if (currentUser.isSuperAdmin) {
        // Super Admin pode filtrar por qualquer tipo
        where.userType = userType;
      } else if (currentUser.userType === 'ADMIN' && userType === 'MANAGER') {
        // Admin normal pode filtrar apenas por gerentes
        where.userType = userType;
      }
      // Ignora filtro de userType para outros casos
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Buscar usuários com paginação e contagens
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          isSuperAdmin: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
          select: {
            managedAttendants: true,
            createdLeads: true,
            attendances: true
          }
        }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    // Para cada usuário, calcular contadores específicos
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        let managers = 0;
        let attendants = 0;
        let leads = 0;
        let attendances = 0;

        if (user.isSuperAdmin) {
          // Super Admin vê todos os dados do sistema
          managers = await prisma.user.count({ where: { userType: 'MANAGER' } });
          attendants = await prisma.attendant.count();
          leads = await prisma.lead.count();
          attendances = await prisma.attendance.count();
        } else if (user.userType === 'ADMIN') {
          // Administrador vê apenas seus gerentes e dados relacionados
          managers = await prisma.user.count({ 
            where: { 
              userType: 'MANAGER',
              adminId: user.id 
            } 
          });
          
          // Contar atendentes dos gerentes deste admin
          attendants = await prisma.attendant.count({
            where: {
              manager: {
                adminId: user.id
              }
            }
          });
          
          // Contar leads dos atendentes dos gerentes deste admin
          leads = await prisma.lead.count({
            where: {
              attendant: {
                manager: {
                  adminId: user.id
                }
              }
            }
          });
          
          // Contar atendimentos dos leads dos atendentes dos gerentes deste admin
          attendances = await prisma.attendance.count({
            where: {
              lead: {
                attendant: {
                  manager: {
                    adminId: user.id
                  }
                }
              }
            }
          });
        } else if (user.userType === 'MANAGER') {
          // Gerente vê apenas seus atendentes e dados relacionados
          attendants = await prisma.attendant.count({
            where: { managerId: user.id }
          });
          
          leads = await prisma.lead.count({
            where: {
              attendant: {
                managerId: user.id
              }
            }
          });
          
          attendances = await prisma.attendance.count({
            where: {
              lead: {
                attendant: {
                  managerId: user.id
                }
              }
            }
          });
        }
        
        return {
          ...user,
          _count: {
            ...user._count,
            managers,
            attendants,
            leads,
            attendances
          }
        };
      })
    );

    return NextResponse.json({
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});

// POST - Criar novo usuário
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const currentUser = (request as any).user;
    const body = await request.json();
    const {
      name,
      email,
      password,
      userType = 'MANAGER',
      isActive = true
    } = body;

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, password' },
        { status: 400 }
      );
    }

    // Verificar permissões para criar administradores
    if (userType === 'ADMIN') {
      // Apenas Super Admin pode criar administradores
      if (!currentUser.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Apenas Super Admin pode criar administradores' },
          { status: 403 }
        );
      }
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Preparar dados do usuário
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      userType,
      isActive,
      isSuperAdmin: false // Novos usuários nunca são Super Admin
    };

    // Se for um gerente sendo criado por um administrador, associar ao admin
    if (userType === 'MANAGER' && currentUser.userType === 'ADMIN' && !currentUser.isSuperAdmin) {
      userData.adminId = currentUser.id;
    }

    // Criar usuário
    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Se for um administrador, criar kanban padrão automaticamente
    if (userType === 'ADMIN') {
      console.log('🚀 Criando kanban padrão para administrador:', newUser.name);
      
      const kanbanColumns = [
        { title: 'Novos Leads', position: 1, color: '#3B82F6' },
        { title: 'Primeiro Contato', position: 2, color: '#8B5CF6' },
        { title: 'Qualificação', position: 3, color: '#F59E0B' },
        { title: 'Proposta', position: 4, color: '#EF4444' },
        { title: 'Negociação', position: 5, color: '#F97316' },
        { title: 'Fechamento', position: 6, color: '#10B981' },
        { title: 'Perdidos', position: 7, color: '#6B7280' }
      ];

      // Verificar se já existem colunas no sistema
      const existingColumns = await prisma.column.count();
      if (existingColumns === 0) {
        for (const col of kanbanColumns) {
          await prisma.column.create({
            data: col
          });
        }
        console.log('✅ Kanban padrão criado para administrador:', newUser.name);
      } else {
        console.log('ℹ️ Kanban já existe no sistema, reutilizando colunas existentes');
      }
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});