import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { withAuth } from '@/app/lib/auth-middleware';

const prisma = new PrismaClient();

// Função para criar hierarquia de teste automaticamente
async function createTestHierarchy(adminId: string, adminName: string) {
  try {
    console.log('🏗️ Criando hierarquia de teste para administrador:', adminName);
    
    // 1. Criar gerente
    const managerPassword = await bcrypt.hash('gerente123', 12);
    const manager = await prisma.user.create({
      data: {
        name: `Gerente de ${adminName}`,
        email: `gerente.${adminId.slice(0, 8)}@zapbot.com`,
        password: managerPassword,
        userType: 'MANAGER',
        isActive: true,
        isSuperAdmin: false
      }
    });
    console.log('✅ Gerente criado:', manager.name);

    // 2. Buscar posição, função e departamento padrão
    let position = await prisma.position.findFirst({ where: { name: 'Atendente' } });
    if (!position) {
      position = await prisma.position.create({
        data: { name: 'Atendente', description: 'Posição de Atendente' }
      });
    }

    let func = await prisma.function.findFirst({ where: { name: 'Atendimento' } });
    if (!func) {
      func = await prisma.function.create({
        data: { name: 'Atendimento', description: 'Função de Atendimento' }
      });
    }

    let department = await prisma.department.findFirst({ where: { name: 'Vendas' } });
    if (!department) {
      department = await prisma.department.create({
        data: { name: 'Vendas', description: 'Departamento de Vendas' }
      });
    }

    // 3. Criar atendente
    const attendantPassword = await bcrypt.hash('atendente123', 10);
    const attendant = await prisma.attendant.create({
      data: {
        name: `Atendente de ${manager.name}`,
        email: `atendente.${adminId.slice(0, 8)}@zapbot.com`,
        password: attendantPassword,
        phone: '(11) 99999-9999',
        managerId: manager.id,
        positionId: position.id,
        functionId: func.id,
        departmentId: department.id,
        startTime: '08:00',
        endTime: '18:00',
        workDays: 'monday,tuesday,wednesday,thursday,friday',
        isActive: true,
        canLogin: true
      }
    });
    console.log('✅ Atendente criado:', attendant.name);

    // 4. Criar colunas do kanban se não existirem
    const columns = [
      { title: 'Chegada', color: '#3B82F6', position: 0 },
      { title: 'Em Atendimento', color: '#F59E0B', position: 1 },
      { title: 'Finalizado', color: '#10B981', position: 2 }
    ];

    for (const col of columns) {
      const existingColumn = await prisma.column.findFirst({ where: { title: col.title } });
      if (!existingColumn) {
        await prisma.column.create({ data: col });
      }
    }

    const chegadaColumn = await prisma.column.findFirst({ where: { title: 'Chegada' } });

    // 5. Criar lead de teste
    const lead = await prisma.lead.create({
      data: {
        name: 'Cliente Teste',
        email: `cliente.teste.${adminId.slice(0, 8)}@exemplo.com`,
        phone: '(11) 88888-8888',
        source: 'Website',
        status: 'novo',
        notes: 'Lead de teste criado automaticamente para demonstração do sistema.',
        attendantId: attendant.id,
        createdBy: manager.id,
        columnId: chegadaColumn?.id || null,
        position: 0
      }
    });
    console.log('✅ Lead criado:', lead.name);

    // 6. Criar atendimento inicial para o lead
    await prisma.attendance.create({
      data: {
        leadId: lead.id,
        userId: manager.id,
        type: 'call',
        subject: 'Primeiro Contato',
        description: 'Atendimento inicial de demonstração. Este é um exemplo de como registrar interações com leads no sistema.',
        status: 'completed',
        priority: 'medium',
        outcome: 'Lead interessado, agendar nova conversa',
        nextAction: 'Enviar proposta comercial'
      }
    });
    console.log('✅ Atendimento inicial criado');

    console.log('🎉 Hierarquia de teste criada com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   👤 Admin: ${adminName}`);
    console.log(`   👨‍💼 Gerente: ${manager.name} (${manager.email})`);
    console.log(`   👩‍💻 Atendente: ${attendant.name} (${attendant.email})`);
    console.log(`   🎯 Lead: ${lead.name} (${lead.email})`);
    console.log(`   📞 Atendimento: Primeiro Contato registrado`);
    
  } catch (error) {
    console.error('❌ Erro ao criar hierarquia de teste:', error);
  }
}

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
    
    // Filtrar baseado no tipo de usuário logado
    if (currentUser.isSuperAdmin) {
      // Super Admin pode ver todos os usuários
      // Não adiciona filtro adicional
    } else if (currentUser.userType === 'ADMIN') {
      // Administradores normais podem ver apenas gerentes da mesma conta e a si mesmos
      where.OR = [
        { 
          userType: 'MANAGER',
          accountId: currentUser.accountId // Apenas gerentes da mesma conta
        },
        { id: currentUser.id } // E a si mesmo
      ];
    } else {
      // Gerentes não deveriam acessar esta API, mas por segurança
      where.id = currentUser.id; // Só pode ver a si mesmo
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

    // Buscar usuários com paginação
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
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
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

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType,
        isActive,
        isSuperAdmin: false // Novos usuários nunca são Super Admin
      },
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

    // Se for um administrador, criar hierarquia de teste automaticamente
    if (userType === 'ADMIN') {
      await createTestHierarchy(newUser.id, name);
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