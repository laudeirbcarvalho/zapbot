const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteCRMTenant() {
  try {
    console.log('🔍 Procurando tenant CRM...');
    
    // Buscar tenant que contenha "CRM" no nome
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: { contains: 'CRM', mode: 'insensitive' } },
          { name: { contains: 'MAUA', mode: 'insensitive' } },
          { slug: { contains: 'crm', mode: 'insensitive' } }
        ]
      },
      include: {
        users: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!tenant) {
      console.log('❌ Nenhum tenant CRM encontrado.');
      return;
    }

    console.log(`✅ Tenant encontrado: ${tenant.name} (ID: ${tenant.id})`);
    console.log(`📊 Usuários associados: ${tenant._count.users}`);

    // Se houver usuários associados, desassociar primeiro
    if (tenant.users.length > 0) {
      console.log('🔄 Desassociando usuários do tenant...');
      await prisma.user.updateMany({
        where: {
          tenantId: tenant.id
        },
        data: {
          tenantId: null
        }
      });
      console.log(`✅ ${tenant.users.length} usuários desassociados.`);
    }

    // Deletar o tenant
    console.log('🗑️ Deletando tenant...');
    await prisma.tenant.delete({
      where: {
        id: tenant.id
      }
    });

    console.log(`✅ Tenant '${tenant.name}' deletado com sucesso!`);

    // Verificar tenants restantes
    const remainingTenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log('\n📋 Tenants restantes:');
    if (remainingTenants.length === 0) {
      console.log('   Nenhum tenant restante.');
    } else {
      remainingTenants.forEach(t => {
        console.log(`   - ${t.name} (${t._count.users} usuários)`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao deletar tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCRMTenant();