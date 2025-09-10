const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAttendants() {
  try {
    const password = '10113412';
    const hashedPassword = await bcrypt.hash(password, 10);

    const attendants = [
      { name: 'Maria Oliveira', email: 'maria.oliveira@empresa.com' },
      { name: 'João Pereira', email: 'joao.pereira@empresa.com' },
      { name: 'Fernanda Costa', email: 'fernanda.costa@empresa.com' },
      { name: 'Pedro Almeida', email: 'pedro.almeida@empresa.com' },
      { name: 'Juliana Rodrigues', email: 'juliana.rodrigues@empresa.com' }
    ];

    console.log('Criando atendentes...');

    for (const attendant of attendants) {
      // Verificar se o atendente já existe
      const existingAttendant = await prisma.attendant.findUnique({
        where: { email: attendant.email },
      });

      if (existingAttendant) {
        console.log(`Atendente ${attendant.name} (${attendant.email}) já existe.`);
        continue;
      }

      // Criar o atendente
      const newAttendant = await prisma.attendant.create({
        data: {
          email: attendant.email,
          name: attendant.name,
          password: hashedPassword,
          startTime: '08:00',
          endTime: '18:00',
          workDays: '1,2,3,4,5', // Segunda a sexta
          canLogin: true,
          isActive: true
        },
      });

      console.log(`Atendente criado: ${newAttendant.name} (${newAttendant.email})`);
    }

    console.log('Todos os atendentes foram processados!');

  } catch (error) {
    console.error('Erro ao criar atendentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAttendants();