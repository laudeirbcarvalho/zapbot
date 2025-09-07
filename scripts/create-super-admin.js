const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Buscar o usuário Laudeir Borges
    const user = await prisma.user.findUnique({
      where: {
        email: 'ti@adlux.com.br'
      }
    });

    if (!user) {
      console.log('Usuário Laudeir Borges não encontrado!');
      return;
    }

    // Converter para Super Admin
    const updatedUser = await prisma.user.update({
      where: {
        email: 'ti@adlux.com.br'
      },
      data: {
        isSuperAdmin: true,
        userType: 'ADMIN'
      }
    });

    console.log('Super Admin criado com sucesso!');
    console.log('Nome:', updatedUser.name);
    console.log('Email:', updatedUser.email);
    console.log('Tipo:', updatedUser.userType);
    console.log('Super Admin:', updatedUser.isSuperAdmin);

  } catch (error) {
    console.error('Erro ao criar Super Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();