const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addDataForJoao() {
  try {
    console.log('🔍 Procurando tenant do João...');
    
    // Buscar o tenant do João
    const joaoTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'João', mode: 'insensitive' } },
          { slug: 'joao-empresa' }
        ]
      }
    });

    if (!joaoTenant) {
      console.log('❌ Tenant do João não encontrado!');
      return;
    }

    console.log(`✅ Tenant encontrado: ${joaoTenant.name} (ID: ${joaoTenant.id})`);

    // Criar mais gerentes
    console.log('\n👥 Criando gerentes...');
    const managers = [
      { email: `gerente1.${Date.now()}@joao.com`, name: 'Carlos Silva', password: 'gerente123' },
      { email: `gerente2.${Date.now() + 1}@joao.com`, name: 'Ana Santos', password: 'gerente123' },
      { email: `gerente3.${Date.now() + 2}@joao.com`, name: 'Pedro Costa', password: 'gerente123' }
    ];

    for (const manager of managers) {
      try {
        const hashedPassword = await bcrypt.hash(manager.password, 10);
        const newManager = await prisma.user.create({
          data: {
            email: manager.email,
            name: manager.name,
            password: hashedPassword,
            userType: 'MANAGER',
            isActive: true,
            tenantId: joaoTenant.id
          }
        });
        console.log(`✅ Gerente criado: ${newManager.name} (${newManager.email})`);
      } catch (error) {
        console.log(`⚠️ Gerente ${manager.name} já existe ou erro: ${error.message}`);
      }
    }

    // Criar mais atendentes
    console.log('\n🎧 Criando atendentes...');
    const attendants = [
      { email: `atendente1.${Date.now() + 10}@joao.com`, name: 'Maria Oliveira', password: 'atendente123' },
      { email: `atendente2.${Date.now() + 11}@joao.com`, name: 'João Pereira', password: 'atendente123' },
      { email: `atendente3.${Date.now() + 12}@joao.com`, name: 'Lucia Ferreira', password: 'atendente123' },
      { email: `atendente4.${Date.now() + 13}@joao.com`, name: 'Roberto Lima', password: 'atendente123' },
      { email: `atendente5.${Date.now() + 14}@joao.com`, name: 'Fernanda Rocha', password: 'atendente123' }
    ];

    for (const attendant of attendants) {
      try {
        const hashedPassword = await bcrypt.hash(attendant.password, 10);
        const newAttendant = await prisma.user.create({
          data: {
            email: attendant.email,
            name: attendant.name,
            password: hashedPassword,
            userType: 'MANAGER',
            isActive: true,
            tenantId: joaoTenant.id
          }
        });
        console.log(`✅ Atendente criado: ${newAttendant.name} (${newAttendant.email})`);
      } catch (error) {
        console.log(`⚠️ Atendente ${attendant.name} já existe ou erro: ${error.message}`);
      }
    }

    // Buscar colunas do kanban
    const columns = await prisma.column.findMany();

    if (columns.length === 0) {
      console.log('⚠️ Nenhuma coluna encontrada, criando colunas padrão...');
      const defaultColumns = [
        { title: 'Novos Leads', color: '#3B82F6', position: 0 },
        { title: 'Em Contato', color: '#F59E0B', position: 1 },
        { title: 'Interessados', color: '#10B981', position: 2 },
        { title: 'Fechados', color: '#EF4444', position: 3 }
      ];

      for (const col of defaultColumns) {
        await prisma.column.create({
          data: {
            title: col.title,
            color: col.color,
            position: col.position
          }
        });
      }
      
      // Buscar colunas novamente
      const newColumns = await prisma.column.findMany();
      columns.push(...newColumns);
    }

    // Buscar todos os usuários do tenant para atribuir leads
    const users = await prisma.user.findMany({
      where: { tenantId: joaoTenant.id }
    });

    // Criar mais leads
    console.log('\n📋 Criando leads...');
    const leads = [
      { name: 'Empresa ABC Ltda', phone: '11987654321', email: 'contato@abc.com', source: 'Website' },
      { name: 'Comércio XYZ', phone: '11876543210', email: 'vendas@xyz.com', source: 'Facebook' },
      { name: 'Indústria 123', phone: '11765432109', email: 'comercial@123.com', source: 'Google Ads' },
      { name: 'Loja Virtual DEF', phone: '11654321098', email: 'info@def.com', source: 'Instagram' },
      { name: 'Serviços GHI', phone: '11543210987', email: 'atendimento@ghi.com', source: 'Indicação' },
      { name: 'Consultoria JKL', phone: '11432109876', email: 'contato@jkl.com', source: 'LinkedIn' },
      { name: 'Tecnologia MNO', phone: '11321098765', email: 'vendas@mno.com', source: 'WhatsApp' },
      { name: 'Educação PQR', phone: '11210987654', email: 'comercial@pqr.com', source: 'Email Marketing' }
    ];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const randomColumn = columns[Math.floor(Math.random() * columns.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const newLead = await prisma.lead.create({
        data: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          columnId: randomColumn.id,
          createdBy: randomUser.id,
          tenantId: joaoTenant.id,
          position: i
        }
      });
      console.log(`✅ Lead criado: ${newLead.name} - Coluna: ${randomColumn.title} - Criado por: ${randomUser.name}`);
    }

    // Criar atendimentos
    console.log('\n💬 Criando atendimentos...');
    const allLeads = await prisma.lead.findMany({
      where: { tenantId: joaoTenant.id }
    });

    const attendanceMessages = [
      'Cliente interessado no produto, solicitou mais informações.',
      'Enviado proposta comercial por email.',
      'Cliente pediu desconto, negociando valores.',
      'Agendada reunião para próxima semana.',
      'Cliente confirmou interesse, aguardando aprovação interna.',
      'Enviado contrato para assinatura.',
      'Cliente solicitou alterações no contrato.',
      'Negociação finalizada com sucesso!'
    ];

    for (let i = 0; i < Math.min(allLeads.length, 15); i++) {
      const lead = allLeads[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomMessage = attendanceMessages[Math.floor(Math.random() * attendanceMessages.length)];
      
      const attendance = await prisma.attendance.create({
        data: {
          leadId: lead.id,
          userId: randomUser.id,
          type: 'note',
          description: randomMessage
        }
      });
      console.log(`✅ Atendimento criado para lead: ${lead.name} - Atendente: ${randomUser.name}`);
    }

    console.log('\n🎉 Dados adicionais criados com sucesso para o tenant do João!');
    console.log('\n📊 Resumo:');
    console.log(`- ${managers.length} novos gerentes`);
    console.log(`- ${attendants.length} novos atendentes`);
    console.log(`- ${leads.length} novos leads`);
    console.log(`- Até 15 novos atendimentos`);

  } catch (error) {
    console.error('❌ Erro ao criar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDataForJoao();