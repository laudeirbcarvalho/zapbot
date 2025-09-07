const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAttendant() {
  try {
    console.log('🌱 Inserindo atendente de teste...');

    const attendant = await prisma.attendant.create({
      data: {
        name: 'Maria Silva Santos',
        email: 'maria.santos@empresa.com',
        phone: '(11) 99999-8888',
        cpf: '123.456.789-00',
        position: 'Consultora de Vendas',
        department: 'Comercial',
        startTime: '08:00',
        endTime: '18:00',
        workDays: '1,2,3,4,5', // Segunda a Sexta
        isActive: true
      }
    });

    console.log('✅ Atendente criado com sucesso:', {
      id: attendant.id,
      name: attendant.name,
      email: attendant.email,
      position: attendant.position,
      horario: `${attendant.startTime} às ${attendant.endTime}`
    });

    // Criar algumas avaliações de exemplo
    console.log('🌱 Inserindo avaliações de exemplo...');

    const ratings = await prisma.rating.createMany({
      data: [
        {
          attendantId: attendant.id,
          score: 5,
          type: 'elogio',
          comment: 'Excelente atendimento, muito atenciosa e prestativa!',
          ratedBy: 'Cliente João Silva'
        },
        {
          attendantId: attendant.id,
          score: 4,
          type: 'avaliacao',
          comment: 'Bom atendimento, resolveu minha dúvida rapidamente.',
          ratedBy: 'Cliente Ana Costa'
        },
        {
          attendantId: attendant.id,
          score: 3,
          type: 'critica',
          comment: 'Poderia ser mais rápida no retorno das mensagens.',
          ratedBy: 'Cliente Pedro Santos'
        }
      ]
    });

    console.log(`✅ ${ratings.count} avaliações criadas com sucesso!`);

    console.log('🎉 Seed do atendente concluído!');
  } catch (error) {
    console.error('❌ Erro ao inserir atendente:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAttendant();