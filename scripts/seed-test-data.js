const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando inserção de dados fictícios...');

  try {
    // 1. Criar Super Admin
    const superAdminPassword = await bcrypt.hash('123456', 10);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@zapbot.com' },
      update: {},
      create: {
        name: 'Super Administrador',
        email: 'admin@zapbot.com',
        password: superAdminPassword,
        userType: 'ADMIN',
        isSuperAdmin: true,
        accountId: 'super-admin-account',
        isActive: true
      }
    });
    console.log('✅ Super Admin criado:', superAdmin.email);

    // 2. Criar Administradores de contas
    const admin1Password = await bcrypt.hash('123456', 10);
    const admin1 = await prisma.user.upsert({
      where: { email: 'admin1@empresa.com' },
      update: {},
      create: {
        name: 'João Administrador',
        email: 'admin1@empresa.com',
        password: admin1Password,
        userType: 'ADMIN',
        isSuperAdmin: false,
        accountId: 'account-empresa-1',
        isActive: true
      }
    });

    const admin2Password = await bcrypt.hash('123456', 10);
    const admin2 = await prisma.user.upsert({
      where: { email: 'admin2@empresa.com' },
      update: {},
      create: {
        name: 'Maria Administradora',
        email: 'admin2@empresa.com',
        password: admin2Password,
        userType: 'ADMIN',
        isSuperAdmin: false,
        accountId: 'account-empresa-2',
        isActive: true
      }
    });
    console.log('✅ Administradores criados');

    // 3. Criar Gerentes
    const manager1Password = await bcrypt.hash('123456', 10);
    const manager1 = await prisma.user.upsert({
      where: { email: 'gerente1@empresa.com' },
      update: {},
      create: {
        name: 'Carlos Gerente',
        email: 'gerente1@empresa.com',
        password: manager1Password,
        userType: 'MANAGER',
        isSuperAdmin: false,
        accountId: 'account-empresa-1',
        isActive: true
      }
    });

    const manager2Password = await bcrypt.hash('123456', 10);
    const manager2 = await prisma.user.upsert({
      where: { email: 'gerente2@empresa.com' },
      update: {},
      create: {
        name: 'Ana Gerente',
        email: 'gerente2@empresa.com',
        password: manager2Password,
        userType: 'MANAGER',
        isSuperAdmin: false,
        accountId: 'account-empresa-2',
        isActive: true
      }
    });
    console.log('✅ Gerentes criados');

    // 4. Criar Departamentos
    const departments = [
      { name: 'Vendas', description: 'Departamento de Vendas' },
      { name: 'Marketing', description: 'Departamento de Marketing' },
      { name: 'Suporte', description: 'Departamento de Suporte ao Cliente' },
      { name: 'Financeiro', description: 'Departamento Financeiro' }
    ];

    for (const dept of departments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: {},
        create: dept
      });
    }
    console.log('✅ Departamentos criados');

    // 5. Criar Posições
    const positions = [
      { name: 'Vendedor', description: 'Vendedor' },
      { name: 'Vendedor Sênior', description: 'Vendedor Sênior' },
      { name: 'Analista de Marketing', description: 'Analista de Marketing' },
      { name: 'Atendente', description: 'Atendente de Suporte' },
      { name: 'Coordenador', description: 'Coordenador de Equipe' }
    ];

    for (const pos of positions) {
      await prisma.position.upsert({
        where: { name: pos.name },
        update: {},
        create: pos
      });
    }
    console.log('✅ Posições criadas');

    // 6. Criar Funções
    const functions = [
      { name: 'Prospecção', description: 'Prospecção de novos clientes' },
      { name: 'Fechamento', description: 'Fechamento de vendas' },
      { name: 'Pós-venda', description: 'Atendimento pós-venda' },
      { name: 'Suporte Técnico', description: 'Suporte técnico especializado' },
      { name: 'Relacionamento', description: 'Relacionamento com cliente' }
    ];

    for (const func of functions) {
      await prisma.function.upsert({
        where: { name: func.name },
        update: {},
        create: func
      });
    }
    console.log('✅ Funções criadas');

    // Buscar IDs criados
    const vendasDept = await prisma.department.findUnique({ where: { name: 'Vendas' } });
    const marketingDept = await prisma.department.findUnique({ where: { name: 'Marketing' } });
    const suporteDept = await prisma.department.findUnique({ where: { name: 'Suporte' } });
    
    const vendedorPos = await prisma.position.findUnique({ where: { name: 'Vendedor' } });
    const vendedorSrPos = await prisma.position.findUnique({ where: { name: 'Vendedor Sênior' } });
    const atendentePos = await prisma.position.findUnique({ where: { name: 'Atendente' } });
    
    const prospeccaoFunc = await prisma.function.findUnique({ where: { name: 'Prospecção' } });
    const fechamentoFunc = await prisma.function.findUnique({ where: { name: 'Fechamento' } });
    const suporteFunc = await prisma.function.findUnique({ where: { name: 'Suporte Técnico' } });

    // 7. Criar Atendentes
    const attendants = [
      {
        name: 'Pedro Silva',
        email: 'pedro@empresa.com',
        phone: '(11) 99999-1111',
        cpf: '123.456.789-01',
        positionId: vendedorPos?.id,
        functionId: prospeccaoFunc?.id,
        departmentId: vendasDept?.id,
        managerId: manager1.id,
        startTime: '08:00',
        endTime: '18:00',
        workDays: '1,2,3,4,5',
        canLogin: true
      },
      {
        name: 'Julia Santos',
        email: 'julia@empresa.com',
        phone: '(11) 99999-2222',
        cpf: '123.456.789-02',
        positionId: vendedorSrPos?.id,
        functionId: fechamentoFunc?.id,
        departmentId: vendasDept?.id,
        managerId: manager1.id,
        startTime: '09:00',
        endTime: '19:00',
        workDays: '1,2,3,4,5',
        canLogin: true
      },
      {
        name: 'Roberto Costa',
        email: 'roberto@empresa.com',
        phone: '(11) 99999-3333',
        cpf: '123.456.789-03',
        positionId: atendentePos?.id,
        functionId: suporteFunc?.id,
        departmentId: suporteDept?.id,
        managerId: manager2.id,
        startTime: '08:00',
        endTime: '17:00',
        workDays: '1,2,3,4,5,6',
        canLogin: false
      },
      {
        name: 'Fernanda Lima',
        email: 'fernanda@empresa.com',
        phone: '(11) 99999-4444',
        cpf: '123.456.789-04',
        positionId: vendedorPos?.id,
        functionId: prospeccaoFunc?.id,
        departmentId: marketingDept?.id,
        managerId: manager2.id,
        startTime: '08:30',
        endTime: '18:30',
        workDays: '1,2,3,4,5',
        canLogin: true
      }
    ];

    for (const attendant of attendants) {
      await prisma.attendant.upsert({
        where: { email: attendant.email },
        update: {},
        create: attendant
      });
    }
    console.log('✅ Atendentes criados');

    // 8. Criar Colunas do Kanban
    const columns = [
      { title: 'Novos Leads', position: 0, color: '#3B82F6' },
      { title: 'Contato Inicial', position: 1, color: '#F59E0B' },
      { title: 'Qualificação', position: 2, color: '#8B5CF6' },
      { title: 'Proposta', position: 3, color: '#EF4444' },
      { title: 'Negociação', position: 4, color: '#F97316' },
      { title: 'Fechado', position: 5, color: '#10B981' }
    ];

    for (const column of columns) {
      const existingColumn = await prisma.column.findFirst({
        where: { title: column.title }
      });
      
      if (!existingColumn) {
        await prisma.column.create({
          data: column
        });
      }
    }
    console.log('✅ Colunas do Kanban criadas');

    // Buscar colunas criadas
    const novosLeadsCol = await prisma.column.findFirst({ where: { title: 'Novos Leads' } });
    const contatoCol = await prisma.column.findFirst({ where: { title: 'Contato Inicial' } });
    const qualificacaoCol = await prisma.column.findFirst({ where: { title: 'Qualificação' } });
    const propostaCol = await prisma.column.findFirst({ where: { title: 'Proposta' } });
    const fechadoCol = await prisma.column.findFirst({ where: { title: 'Fechado' } });

    // Buscar atendentes criados
    const pedroAttendant = await prisma.attendant.findUnique({ where: { email: 'pedro@empresa.com' } });
    const juliaAttendant = await prisma.attendant.findUnique({ where: { email: 'julia@empresa.com' } });
    const robertoAttendant = await prisma.attendant.findUnique({ where: { email: 'roberto@empresa.com' } });
    const fernandaAttendant = await prisma.attendant.findUnique({ where: { email: 'fernanda@empresa.com' } });

    // 9. Criar Leads fictícios
    const leads = [
      {
        name: 'João da Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 98765-4321',
        source: 'Website',
        status: 'novo',
        notes: 'Interessado em nossos serviços de consultoria',
        columnId: novosLeadsCol?.id,
        position: 0,
        attendantId: pedroAttendant?.id,
        createdBy: manager1.id
      },
      {
        name: 'Maria Oliveira',
        email: 'maria.oliveira@email.com',
        phone: '(11) 98765-4322',
        source: 'Facebook',
        status: 'contato_inicial',
        notes: 'Primeira conversa realizada, demonstrou interesse',
        columnId: contatoCol?.id,
        position: 0,
        attendantId: juliaAttendant?.id,
        createdBy: manager1.id
      },
      {
        name: 'Carlos Santos',
        email: 'carlos.santos@email.com',
        phone: '(11) 98765-4323',
        source: 'Google Ads',
        status: 'qualificacao',
        notes: 'Lead qualificado, tem orçamento disponível',
        columnId: qualificacaoCol?.id,
        position: 0,
        attendantId: juliaAttendant?.id,
        createdBy: manager2.id
      },
      {
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(11) 98765-4324',
        source: 'Indicação',
        status: 'proposta',
        notes: 'Proposta enviada, aguardando retorno',
        columnId: propostaCol?.id,
        position: 0,
        attendantId: fernandaAttendant?.id,
        createdBy: manager2.id
      },
      {
        name: 'Roberto Lima',
        email: 'roberto.lima@email.com',
        phone: '(11) 98765-4325',
        source: 'LinkedIn',
        status: 'fechado',
        notes: 'Cliente convertido com sucesso!',
        columnId: fechadoCol?.id,
        position: 0,
        attendantId: pedroAttendant?.id,
        createdBy: manager1.id
      },
      {
        name: 'Fernanda Souza',
        email: 'fernanda.souza@email.com',
        phone: '(11) 98765-4326',
        source: 'Website',
        status: 'novo',
        notes: 'Solicitou informações sobre preços',
        columnId: novosLeadsCol?.id,
        position: 1,
        attendantId: robertoAttendant?.id,
        createdBy: manager1.id
      }
    ];

    for (const lead of leads) {
      await prisma.lead.create({
        data: lead
      });
    }
    console.log('✅ Leads fictícios criados');

    // 10. Criar algumas avaliações
    const ratings = [
      {
        attendantId: pedroAttendant?.id,
        score: 5,
        type: 'elogio',
        comment: 'Excelente atendimento, muito prestativo!',
        ratedBy: 'Cliente João'
      },
      {
        attendantId: juliaAttendant?.id,
        score: 4,
        type: 'avaliacao',
        comment: 'Boa comunicação e agilidade no atendimento',
        ratedBy: 'Cliente Maria'
      },
      {
        attendantId: fernandaAttendant?.id,
        score: 5,
        type: 'elogio',
        comment: 'Muito profissional e eficiente',
        ratedBy: 'Cliente Ana'
      }
    ];

    for (const rating of ratings) {
      if (rating.attendantId) {
        await prisma.rating.create({
          data: rating
        });
      }
    }
    console.log('✅ Avaliações criadas');

    console.log('\n🎉 Dados fictícios inseridos com sucesso!');
    console.log('\n📋 Resumo dos dados criados:');
    console.log('- 1 Super Admin (admin@zapbot.com)');
    console.log('- 2 Administradores (admin1@empresa.com, admin2@empresa.com)');
    console.log('- 2 Gerentes (gerente1@empresa.com, gerente2@empresa.com)');
    console.log('- 4 Atendentes');
    console.log('- 4 Departamentos');
    console.log('- 5 Posições');
    console.log('- 5 Funções');
    console.log('- 6 Colunas do Kanban');
    console.log('- 6 Leads fictícios');
    console.log('- 3 Avaliações');
    console.log('\n🔑 Senha padrão para todos os usuários: 123456');

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
