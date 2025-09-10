const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleLeads() {
  try {
    const leads = [
      {
        name: 'João da Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-1111',
        source: 'Website',
        status: 'novo',
        notes: 'Interessado em nossos serviços de consultoria'
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(11) 99999-2222',
        source: 'Facebook',
        status: 'contato',
        notes: 'Solicitou orçamento via Facebook'
      },
      {
        name: 'Carlos Oliveira',
        email: 'carlos.oliveira@email.com',
        phone: '(11) 99999-3333',
        source: 'Google Ads',
        status: 'qualificado',
        notes: 'Lead qualificado, tem orçamento disponível'
      },
      {
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(11) 99999-4444',
        source: 'Indicação',
        status: 'proposta',
        notes: 'Proposta enviada, aguardando retorno'
      },
      {
        name: 'Roberto Lima',
        email: 'roberto.lima@email.com',
        phone: '(11) 99999-5555',
        source: 'LinkedIn',
        status: 'negociacao',
        notes: 'Em negociação de valores e prazos'
      },
      {
        name: 'Fernanda Alves',
        email: 'fernanda.alves@email.com',
        phone: '(11) 99999-6666',
        source: 'Website',
        status: 'ganho',
        notes: 'Cliente fechado! Contrato assinado'
      },
      {
        name: 'Pedro Souza',
        email: 'pedro.souza@email.com',
        phone: '(11) 99999-7777',
        source: 'Email Marketing',
        status: 'perdido',
        notes: 'Optou pela concorrência'
      }
    ];

    console.log('Criando leads de exemplo...');

    for (const leadData of leads) {
      // Verificar se o lead já existe
      const existingLead = await prisma.lead.findFirst({
        where: { email: leadData.email },
      });

      if (existingLead) {
        console.log(`Lead ${leadData.name} (${leadData.email}) já existe.`);
        continue;
      }

      // Criar o lead
      const lead = await prisma.lead.create({
        data: leadData
      });

      console.log(`Lead criado: ${lead.name} (${lead.email}) - Status: ${lead.status}`);
    }

    console.log('Todos os leads foram processados!');

  } catch (error) {
    console.error('Erro ao criar leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleLeads();