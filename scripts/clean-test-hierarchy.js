const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanTestHierarchy() {
  try {
    console.log('🧹 Limpando dados de teste da hierarquia...\n');

    // 1. Deletar atendentes de teste
    console.log('1️⃣ Removendo atendentes de teste...');
    const deletedAttendants = await prisma.attendant.deleteMany({
      where: {
        OR: [
          { email: { contains: 'teste@empresa.com' } },
          { name: { contains: 'Teste Hierarquia' } },
          { tenantId: 'tenant-teste-hierarquia' }
        ]
      }
    });
    console.log(`✅ ${deletedAttendants.count} atendente(s) removido(s)`);

    // 2. Deletar usuários de teste (gerentes e admins)
    console.log('2️⃣ Removendo usuários de teste...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'teste@empresa.com' } },
          { name: { contains: 'Teste Hierarquia' } },
          { tenantId: 'tenant-teste-hierarquia' }
        ]
      }
    });
    console.log(`✅ ${deletedUsers.count} usuário(s) removido(s)`);

    // 3. Deletar tenant de teste
    console.log('3️⃣ Removendo tenant de teste...');
    const deletedTenant = await prisma.tenant.deleteMany({
      where: {
        OR: [
          { id: 'tenant-teste-hierarquia' },
          { slug: 'empresa-teste-hierarquia' },
          { name: { contains: 'Teste Hierarquia' } }
        ]
      }
    });
    console.log(`✅ ${deletedTenant.count} tenant(s) removido(s)`);

    console.log('\n🎉 Limpeza concluída! Dados de teste removidos.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestHierarchy();