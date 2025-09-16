const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPositions() {
  console.log('👔 Iniciando seed de cargos...');

  const positions = [
    {
      name: 'Diretor Geral',
      description: 'Responsável pela direção geral da empresa'
    },
    {
      name: 'Gerente de Vendas',
      description: 'Responsável pela gestão da equipe de vendas'
    },
    {
      name: 'Gerente de Marketing',
      description: 'Responsável pela gestão das estratégias de marketing'
    },
    {
      name: 'Gerente de RH',
      description: 'Responsável pela gestão de recursos humanos'
    },
    {
      name: 'Gerente Financeiro',
      description: 'Responsável pela gestão financeira da empresa'
    },
    {
      name: 'Coordenador de Vendas',
      description: 'Coordena as atividades da equipe de vendas'
    },
    {
      name: 'Coordenador de Marketing',
      description: 'Coordena as atividades de marketing'
    },
    {
      name: 'Coordenador de Atendimento',
      description: 'Coordena as atividades de atendimento ao cliente'
    },
    {
      name: 'Supervisor de Vendas',
      description: 'Supervisiona as atividades de vendas'
    },
    {
      name: 'Supervisor de Atendimento',
      description: 'Supervisiona as atividades de atendimento'
    },
    {
      name: 'Vendedor',
      description: 'Responsável pela venda de produtos e serviços'
    },
    {
      name: 'Vendedor Sênior',
      description: 'Vendedor com experiência avançada'
    },
    {
      name: 'Vendedor Pleno',
      description: 'Vendedor com experiência intermediária'
    },
    {
      name: 'Vendedor Júnior',
      description: 'Vendedor em início de carreira'
    },
    {
      name: 'Atendente',
      description: 'Responsável pelo atendimento aos clientes'
    },
    {
      name: 'Atendente Sênior',
      description: 'Atendente com experiência avançada'
    },
    {
      name: 'Atendente Pleno',
      description: 'Atendente com experiência intermediária'
    },
    {
      name: 'Atendente Júnior',
      description: 'Atendente em início de carreira'
    },
    {
      name: 'Analista de Marketing',
      description: 'Responsável por análises e estratégias de marketing'
    },
    {
      name: 'Analista Financeiro',
      description: 'Responsável por análises financeiras'
    },
    {
      name: 'Analista de RH',
      description: 'Responsável por processos de recursos humanos'
    },
    {
      name: 'Assistente Administrativo',
      description: 'Responsável por atividades administrativas'
    },
    {
      name: 'Assistente de Vendas',
      description: 'Auxilia nas atividades de vendas'
    },
    {
      name: 'Assistente de Marketing',
      description: 'Auxilia nas atividades de marketing'
    },
    {
      name: 'Estagiário',
      description: 'Estudante em programa de estágio'
    }
  ];

  try {
    // Verificar se já existem cargos
    const existingPositions = await prisma.position.count();
    
    if (existingPositions > 0) {
      console.log(`✅ Já existem ${existingPositions} cargos no banco de dados.`);
      return;
    }

    // Criar cargos padrão
    for (const position of positions) {
      await prisma.position.create({
        data: position
      });
      console.log(`✅ Cargo criado: ${position.name}`);
    }

    console.log('🎉 Seed de cargos concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar cargos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedPositions()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedPositions };