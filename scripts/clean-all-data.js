const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAllData() {
  try {
    console.log('🧹 Iniciando limpeza completa do banco de dados...');
    
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
    
    // Contar dados antes da limpeza
    const counts = {
      users: await prisma.user.count(),
      leads: await prisma.lead.count(),
      attendants: await prisma.attendant.count(),
      attendances: await prisma.attendance.count(),
      ratings: await prisma.rating.count(),
      columns: await prisma.column.count(),
      tenants: await prisma.tenant.count(),
      systemSettings: await prisma.systemSettings.count(),
      integrations: await prisma.integration.count()
    };
    
    console.log('📊 Dados antes da limpeza:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count}`);
    });
    
    // Deletar em ordem para respeitar as foreign keys
    console.log('\n🗑️ Iniciando exclusão...');
    
    // 1. Deletar ratings
    const deletedRatings = await prisma.rating.deleteMany({});
    console.log(`  ✓ Ratings removidos: ${deletedRatings.count}`);
    
    // 2. Deletar attendances
    const deletedAttendances = await prisma.attendance.deleteMany({});
    console.log(`  ✓ Attendances removidos: ${deletedAttendances.count}`);
    
    // 3. Deletar leads
    const deletedLeads = await prisma.lead.deleteMany({});
    console.log(`  ✓ Leads removidos: ${deletedLeads.count}`);
    
    // 4. Deletar attendants
    const deletedAttendants = await prisma.attendant.deleteMany({});
    console.log(`  ✓ Attendants removidos: ${deletedAttendants.count}`);
    
    // 5. Deletar columns
    const deletedColumns = await prisma.column.deleteMany({});
    console.log(`  ✓ Columns removidos: ${deletedColumns.count}`);
    
    // 6. Deletar system settings
    const deletedSettings = await prisma.systemSettings.deleteMany({});
    console.log(`  ✓ System Settings removidos: ${deletedSettings.count}`);
    
    // 7. Deletar tenants
    const deletedTenants = await prisma.tenant.deleteMany({});
    console.log(`  ✓ Tenants removidos: ${deletedTenants.count}`);
    
    // 8. Deletar integrations
    const deletedIntegrations = await prisma.integration.deleteMany({});
    console.log(`  ✓ Integrations removidos: ${deletedIntegrations.count}`);
    
    // 9. Deletar todos os usuários exceto o super admin
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          not: superAdmin.id
        }
      }
    });
    console.log(`  ✓ Usuários removidos: ${deletedUsers.count}`);
    
    // Contar dados após a limpeza
    const finalCounts = {
      users: await prisma.user.count(),
      leads: await prisma.lead.count(),
      attendants: await prisma.attendant.count(),
      attendances: await prisma.attendance.count(),
      ratings: await prisma.rating.count(),
      columns: await prisma.column.count(),
      tenants: await prisma.tenant.count(),
      systemSettings: await prisma.systemSettings.count(),
      integrations: await prisma.integration.count()
    };
    
    console.log('\n📊 Dados após a limpeza:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count}`);
    });
    
    console.log('\n✅ Limpeza completa concluída com sucesso!');
    console.log(`🔒 Super admin preservado: ${superAdmin.name}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllData();