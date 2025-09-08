const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanUsers() {
  try {
    console.log('🧹 Iniciando limpeza de usuários...');
    
    // Buscar o super admin para preservá-lo
    const superAdmin = await prisma.user.findFirst({
      where: {
        isSuperAdmin: true
      }
    });
    
    if (!superAdmin) {
      console.log('❌ Super admin não encontrado! Abortando limpeza.');
      return;
    }
    
    console.log(`✅ Super admin encontrado: ${superAdmin.name} (${superAdmin.email})`);
    
    // Contar usuários antes da limpeza
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total de usuários antes da limpeza: ${totalUsers}`);
    
    // Deletar todos os usuários exceto o super admin
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          not: superAdmin.id
        }
      }
    });
    
    console.log(`🗑️ Usuários removidos: ${deletedUsers.count}`);
    
    // Contar usuários após a limpeza
    const remainingUsers = await prisma.user.count();
    console.log(`📊 Total de usuários após a limpeza: ${remainingUsers}`);
    
    console.log('✅ Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUsers();