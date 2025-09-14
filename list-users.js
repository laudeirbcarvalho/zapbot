const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('👥 Listando usuários do banco de dados...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isSuperAdmin: true,
        isActive: true
      }
    });
    
    console.log(`📊 Total de usuários encontrados: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 Lista de usuários:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Nome: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Tipo: ${user.userType}`);
        console.log(`   Super Admin: ${user.isSuperAdmin}`);
        console.log(`   Ativo: ${user.isActive}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ Nenhum usuário encontrado no banco de dados.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();