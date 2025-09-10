const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createLaudeirAdmin() {
  try {
    // Dados do administrador Laudeir
    const email = 'laudeirbcarvalho@gmail.com';
    const password = '10113412';
    const name = 'Laudeir';

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`Usuário com email ${email} já existe. Atualizando para SuperAdmin...`);
      
      // Atualizar usuário existente para SuperAdmin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          isSuperAdmin: true,
          userType: 'ADMIN',
          name: name
        }
      });
      
      console.log('SuperAdmin atualizado com sucesso!');
      console.log('Nome:', updatedUser.name);
      console.log('Email:', updatedUser.email);
      console.log('Tipo:', updatedUser.userType);
      console.log('Super Admin:', updatedUser.isSuperAdmin);
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o usuário SuperAdmin
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        userType: 'ADMIN',
        isSuperAdmin: true
      },
    });

    console.log('SuperAdmin Laudeir criado com sucesso!');
    console.log('Nome:', user.name);
    console.log('Email:', user.email);
    console.log('Tipo:', user.userType);
    console.log('Super Admin:', user.isSuperAdmin);

  } catch (error) {
    console.error('Erro ao criar SuperAdmin Laudeir:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLaudeirAdmin();