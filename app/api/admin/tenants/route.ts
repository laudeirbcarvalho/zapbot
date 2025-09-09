import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireSuperAdmin } from '@/app/lib/jwt-auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação JWT
    requireSuperAdmin(request);

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        isSuperAdmin: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            settings: true
          }
        },
        users: {
          where: {
            userType: 'MANAGER'
          },
          include: {
            managedAttendants: {
              include: {
                _count: {
                  select: {
                    leads: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    
    if (error.message.includes('Acesso negado') || error.message.includes('Token')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação JWT
    requireSuperAdmin(request);

    const { name, slug, domain, email, password, logo } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug já está em uso' },
        { status: 400 }
      );
    }

    // Verificar se domínio já existe (se fornecido)
    if (domain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { domain }
      });

      if (existingDomain) {
        return NextResponse.json(
          { error: 'Domínio já está em uso' },
          { status: 400 }
        );
      }
    }

    // Verificar se email já existe
    const existingEmail = await prisma.tenant.findFirst({
      where: { email }
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        domain: domain || null,
        email,
        password: hashedPassword,
        logo: logo || null,
        isActive: true
      }
    });

    // Criar configurações padrão para o novo tenant
    const defaultSettings = [
      {
        key: 'system_name',
        value: name,
        type: 'string',
        category: 'general',
        description: 'Nome do sistema exibido na interface',
        isPublic: true
      },
      {
        key: 'system_logo_url',
        value: '/logo.png',
        type: 'string',
        category: 'appearance',
        description: 'URL do logo do sistema',
        isPublic: true
      },
      {
        key: 'system_url',
        value: domain ? `https://${domain}` : `${process.env.NEXTAUTH_URL}/login/${slug}`,
        type: 'string',
        category: 'general',
        description: 'URL base do sistema',
        isPublic: false
      }
    ];

    await prisma.systemSettings.createMany({
      data: defaultSettings.map(setting => ({
        tenantId: tenant.id,
        ...setting
      }))
    });

    // Criar usuário administrador para o tenant
    const adminUser = await prisma.user.create({
      data: {
        name: `Admin ${name}`,
        email: email,
        password: hashedPassword,
        userType: 'ADMIN',
        tenantId: tenant.id,
        isActive: true
      }
    });

    // Criar gerente teste
    const testManager = await prisma.user.create({
      data: {
        name: 'Gerente Teste',
        email: `gerente@${slug}.test`,
        password: await bcrypt.hash('123456', 12),
        userType: 'MANAGER',
        tenantId: tenant.id,
        isActive: true
      }
    });

    // Criar attendant para o gerente teste
    const testAttendant = await prisma.attendant.create({
      data: {
        name: 'Gerente Teste',
        email: `gerente@${slug}.test`,
        phone: '(11) 99999-9999',
        managerId: testManager.id,
        startTime: '08:00',
        endTime: '18:00',
        workDays: '1,2,3,4,5',
        isActive: true
      }
    });

    // Criar colunas padrão do Kanban
    const defaultColumns = [
      { title: 'Chegada', position: 0, color: '#EF4444' }, // Vermelho
      { title: 'Contato', position: 1, color: '#F97316' }, // Laranja
      { title: 'Qualificação', position: 2, color: '#EAB308' }, // Amarelo
      { title: 'Proposta', position: 3, color: '#3B82F6' }, // Azul
      { title: 'Negociação', position: 4, color: '#8B5CF6' }, // Roxo
      { title: 'Fechamento', position: 5, color: '#10B981' }, // Verde
      { title: 'Perdido', position: 6, color: '#6B7280' } // Cinza
    ];

    const createdColumns = await Promise.all(
      defaultColumns.map(column => 
        prisma.column.create({
          data: column
        })
      )
    );

    // Criar lead teste para o gerente (associar à primeira coluna)
    const testLead = await prisma.lead.create({
      data: {
        name: 'Lead Teste',
        email: `lead@${slug}.test`,
        phone: '(11) 88888-8888',
        source: 'Sistema',
        status: 'novo',
        notes: 'Lead criado automaticamente para teste do sistema',
        attendantId: testAttendant.id,
        createdBy: testManager.id,
        columnId: createdColumns[0].id // Associar à coluna "Chegada"
      }
    });

    return NextResponse.json({ 
      tenant,
      adminUser: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email
      },
      testManager: {
        id: testManager.id,
        name: testManager.name,
        email: testManager.email
      },
      testLead: {
        id: testLead.id,
        name: testLead.name,
        email: testLead.email
      },
      kanbanColumns: createdColumns.map(col => ({
        id: col.id,
        title: col.title,
        position: col.position,
        color: col.color
      }))
    });
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    
    if (error.message.includes('Acesso negado') || error.message.includes('Token')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}