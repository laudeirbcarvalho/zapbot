const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedKanban() {
  console.log('🌱 Populando Kanban...');

  try {
    // Criar colunas padrão
    const columns = [
      { id: 'novo', title: 'Novo', position: 0 },
      { id: 'em_contato', title: 'Em Contato', position: 1 },
      { id: 'qualificado', title: 'Qualificado', position: 2 },
      { id: 'negociacao', title: 'Negociação', position: 3 },
      { id: 'fechado', title: 'Fechado', position: 4 }
    ];

    for (const column of columns) {
      await prisma.column.upsert({
        where: { id: column.id },
        update: {},
        create: column
      });
    }

    console.log('✅ Colunas criadas');

    // Criar leads de exemplo
    const leads = [
      {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        source: 'Website',
        status: 'novo',
        columnId: 'novo',
        position: 0,
        notes: 'Lead interessado em nossos serviços'
      },
      {
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '(11) 88888-8888',
        source: 'Facebook',
        status: 'em_contato',
        columnId: 'em_contato',
        position: 0,
        notes: 'Primeiro contato realizado'
      },
      {
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        phone: '(11) 77777-7777',
        source: 'Google Ads',
        status: 'qualificado',
        columnId: 'qualificado',
        position: 0,
        notes: 'Lead qualificado, interessado em comprar'
      },
      {
        name: 'Ana Oliveira',
        email: 'ana@email.com',
        phone: '(11) 66666-6666',
        source: 'Indicação',
        status: 'negociacao',
        columnId: 'negociacao',
        position: 0,
        notes: 'Em negociação de preço'
      },
      {
        name: 'Carlos Ferreira',
        email: 'carlos@email.com',
        phone: '(11) 55555-5555',
        source: 'LinkedIn',
        status: 'fechado',
        columnId: 'fechado',
        position: 0,
        notes: 'Venda fechada com sucesso!'
      }
    ];

    for (const lead of leads) {
      const existingLead = await prisma.lead.findFirst({
        where: { email: lead.email }
      });

      if (!existingLead) {
        await prisma.lead.create({
          data: lead
        });
      }
    }

    console.log('✅ Leads de exemplo criados');
    console.log('🎉 Kanban populado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao popular Kanban:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedKanban();