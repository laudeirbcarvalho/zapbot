const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteLaudeir() {
  try {
    console.log('=== EXCLUINDO USUÁRIO LAUDEIR BORGES - TI ===');
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: 'user-admin' }
    });
    
    if (!user) {
      console.log('❌ Usuário Laudeir Borges - TI não encontrado!');
      return;
    }
    
    console.log('👤 Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isSuperAdmin: user.isSuperAdmin
    });
    
    // Excluir o usuário
    await prisma.user.delete({
      where: { id: 'user-admin' }
    });
    
    console.log('✅ Usuário Laudeir Borges - TI excluído com sucesso!');
    
    // Verificar usuários restantes
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isSuperAdmin: true
      },
      orderBy: [
        { isSuperAdmin: 'desc' },
        { userType: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log('\n📋 Usuários restantes no sistema:');
    remainingUsers.forEach(user => {
      const type = user.isSuperAdmin ? '🔴 SUPER ADMIN' : 
                   user.userType === 'ADMIN' ? '🟡 ADMINISTRADOR' : '🟢 GERENTE';
      console.log(`  ${type} - ${user.name} (${user.email})`);
    });
    
    console.log(`\n📊 Total de usuários restantes: ${remainingUsers.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteLaudeir();