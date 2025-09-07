import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDepartments() {
  console.log('🌱 Inserindo departamentos de exemplo...');

  const departments = [
    {
      name: 'Vendas',
      description: 'Departamento responsável pela prospecção e fechamento de vendas'
    },
    {
      name: 'Marketing',
      description: 'Departamento responsável por campanhas, leads e branding'
    },
    {
      name: 'Atendimento ao Cliente',
      description: 'Departamento responsável pelo suporte e relacionamento com clientes'
    },
    {
      name: 'Pós-Vendas',
      description: 'Departamento responsável pelo acompanhamento após a venda'
    },
    {
      name: 'Sucesso do Cliente',
      description: 'Departamento focado na retenção e satisfação dos clientes'
    },
    {
      name: 'Inside Sales',
      description: 'Departamento de vendas internas e qualificação de leads'
    },
    {
      name: 'Business Development',
      description: 'Departamento de desenvolvimento de negócios e parcerias'
    },
    {
      name: 'Comercial',
      description: 'Departamento comercial geral e gestão de contas'
    }
  ];

  for (const dept of departments) {
    try {
      // Verificar se o departamento já existe
      const existing = await prisma.department.findUnique({
        where: { name: dept.name }
      });

      if (!existing) {
        await prisma.department.create({
          data: dept
        });
        console.log(`✅ Departamento "${dept.name}" criado com sucesso`);
      } else {
        console.log(`⚠️  Departamento "${dept.name}" já existe`);
      }
    } catch (error) {
      console.error(`❌ Erro ao criar departamento "${dept.name}":`, error);
    }
  }

  console.log('🎉 Seed de departamentos concluído!');
}

seedDepartments()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });