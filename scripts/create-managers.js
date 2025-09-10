const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createManagers() {
  try {
    const password = '10113412';
    const hashedPassword = await bcrypt.hash(password, 10);

    const managers = [
      { name: 'Carlos Silva', email: 'carlos.silva@empresa.com' },
      { name: 'Ana Santos', email: 'ana.santos@empresa.com' },
      { name: 'Roberto Lima', email: 'roberto.lima@empresa.com' }
    ];

    console.log('Criando gerentes...');

    for (const manager of managers) {
      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: manager.email },
      });

      if (existingUser) {
        console.log(`Gerente ${manager.name} (${manager.email}) já existe.`);
        continue;
      }

      // Criar o gerente
      const user = await prisma.user.create({
        data: {
          email: manager.email,
          name: manager.name,
          password: hashedPassword,
          userType: 'MANAGER',
          isSuperAdmin: false
        },
      });

      console.log(`Gerente criado: ${user.name} (${user.email})`);
    }

    console.log('Todos os gerentes foram processados!');

  } catch (error) {
    console.error('Erro ao criar gerentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createManagers();