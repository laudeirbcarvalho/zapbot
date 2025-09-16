const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDepartments() {
  console.log('🏢 Iniciando seed de departamentos...');

  const departments = [
    {
      name: 'Vendas',
      description: 'Departamento responsável por vendas e relacionamento com clientes'
    },
    {
      name: 'Marketing',
      description: 'Departamento responsável por marketing e comunicação'
    },
    {
      name: 'Atendimento ao Cliente',
      description: 'Departamento responsável pelo suporte e atendimento aos clientes'
    },
    {
      name: 'Recursos Humanos',
      description: 'Departamento responsável pela gestão de pessoas e recursos humanos'
    },
    {
      name: 'Financeiro',
      description: 'Departamento responsável pela gestão financeira e contábil'
    },
    {
      name: 'Tecnologia da Informação',
      description: 'Departamento responsável pela infraestrutura e desenvolvimento de sistemas'
    },
    {
      name: 'Operações',
      description: 'Departamento responsável pelas operações e processos internos'
    },
    {
      name: 'Jurídico',
      description: 'Departamento responsável por questões legais e compliance'
    },
    {
      name: 'Compras',
      description: 'Departamento responsável por aquisições e fornecedores'
    },
    {
      name: 'Qualidade',
      description: 'Departamento responsável pelo controle de qualidade e processos'
    }
  ];

  try {
    // Verificar se já existem departamentos
    const existingDepartments = await prisma.department.count();
    
    if (existingDepartments > 0) {
      console.log(`✅ Já existem ${existingDepartments} departamentos no banco de dados.`);
      return;
    }

    // Criar departamentos padrão
    for (const department of departments) {
      await prisma.department.create({
        data: department
      });
      console.log(`✅ Departamento criado: ${department.name}`);
    }

    console.log('🎉 Seed de departamentos concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar departamentos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedDepartments()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedDepartments };