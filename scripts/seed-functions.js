const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFunctions() {
  console.log('⚙️ Iniciando seed de funções...');

  const functions = [
    {
      name: 'Liderança e Gestão',
      description: 'Responsável por liderar equipes e tomar decisões estratégicas'
    },
    {
      name: 'Vendas e Negociação',
      description: 'Responsável por vendas, negociação e relacionamento com clientes'
    },
    {
      name: 'Atendimento ao Cliente',
      description: 'Responsável pelo suporte e atendimento aos clientes'
    },
    {
      name: 'Marketing e Comunicação',
      description: 'Responsável por estratégias de marketing e comunicação'
    },
    {
      name: 'Análise e Planejamento',
      description: 'Responsável por análises, relatórios e planejamento estratégico'
    },
    {
      name: 'Gestão Financeira',
      description: 'Responsável por controles financeiros e análises econômicas'
    },
    {
      name: 'Recursos Humanos',
      description: 'Responsável por gestão de pessoas e processos de RH'
    },
    {
      name: 'Operações e Processos',
      description: 'Responsável por operações diárias e melhoria de processos'
    },
    {
      name: 'Tecnologia e Sistemas',
      description: 'Responsável por suporte técnico e desenvolvimento de sistemas'
    },
    {
      name: 'Qualidade e Compliance',
      description: 'Responsável por controle de qualidade e conformidade'
    },
    {
      name: 'Treinamento e Desenvolvimento',
      description: 'Responsável por capacitação e desenvolvimento de equipes'
    },
    {
      name: 'Pesquisa e Desenvolvimento',
      description: 'Responsável por inovação e desenvolvimento de produtos/serviços'
    },
    {
      name: 'Logística e Distribuição',
      description: 'Responsável por logística, estoque e distribuição'
    },
    {
      name: 'Compras e Fornecedores',
      description: 'Responsável por aquisições e gestão de fornecedores'
    },
    {
      name: 'Jurídico e Contratos',
      description: 'Responsável por questões legais e elaboração de contratos'
    },
    {
      name: 'Segurança e Riscos',
      description: 'Responsável por segurança e gestão de riscos'
    },
    {
      name: 'Comunicação Interna',
      description: 'Responsável pela comunicação e engajamento interno'
    },
    {
      name: 'Relacionamento Institucional',
      description: 'Responsável por parcerias e relacionamentos institucionais'
    },
    {
      name: 'Auditoria e Controles',
      description: 'Responsável por auditoria interna e controles'
    },
    {
      name: 'Inovação e Melhoria',
      description: 'Responsável por inovação e melhoria contínua'
    }
  ];

  try {
    // Verificar se já existem funções
    const existingFunctions = await prisma.function.count();
    
    if (existingFunctions > 0) {
      console.log(`✅ Já existem ${existingFunctions} funções no banco de dados.`);
      return;
    }

    // Criar funções padrão
    for (const func of functions) {
      await prisma.function.create({
        data: func
      });
      console.log(`✅ Função criada: ${func.name}`);
    }

    console.log('🎉 Seed de funções concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar funções:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedFunctions()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedFunctions };