const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAttendantAssociations() {
  try {
    console.log('🔍 Verificando associações de atendentes...');
    
    // 1. Buscar todos os administradores
    const admins = await prisma.user.findMany({
      where: {
        userType: 'ADMIN',
        isActive: true
      },
      include: {
        Tenant: true,
        adminAttendants: {
          select: {
            id: true,
            name: true,
            email: true,
            adminId: true,
            tenantId: true,
            isActive: true
          }
        }
      }
    });
    
    console.log(`\n📊 Encontrados ${admins.length} administradores:\n`);
    
    for (const admin of admins) {
      console.log(`👤 Admin: ${admin.name}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Tenant: ${admin.Tenant?.name || 'N/A'} (${admin.tenantId})`);
      console.log(`   Atendentes: ${admin.adminAttendants.length}`);
      
      if (admin.adminAttendants.length > 0) {
        admin.adminAttendants.forEach((attendant, index) => {
          const isCorrectAssociation = attendant.adminId === admin.id && attendant.tenantId === admin.tenantId;
          const status = isCorrectAssociation ? '✅' : '❌';
          
          console.log(`     ${index + 1}. ${status} ${attendant.name} (${attendant.email})`);
          if (!isCorrectAssociation) {
            console.log(`        ⚠️  AdminId: ${attendant.adminId} (esperado: ${admin.id})`);
            console.log(`        ⚠️  TenantId: ${attendant.tenantId} (esperado: ${admin.tenantId})`);
          }
        });
      } else {
        console.log('     📝 Nenhum atendente associado');
      }
      console.log('');
    }
    
    // 2. Buscar atendentes órfãos (sem adminId ou com adminId inválido)
    const orphanAttendants = await prisma.attendant.findMany({
      where: {
        OR: [
          { adminId: null },
          {
            admin: null
          }
        ],
        isActive: true
      },
      include: {
        Tenant: true
      }
    });
    
    if (orphanAttendants.length > 0) {
      console.log(`\n🚨 Encontrados ${orphanAttendants.length} atendentes órfãos:\n`);
      
      orphanAttendants.forEach((attendant, index) => {
        console.log(`${index + 1}. ${attendant.name} (${attendant.email})`);
        console.log(`   AdminId: ${attendant.adminId || 'NULL'}`);
        console.log(`   TenantId: ${attendant.tenantId || 'NULL'}`);
        console.log(`   Tenant: ${attendant.Tenant?.name || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n✅ Nenhum atendente órfão encontrado!');
    }
    
    // 3. Verificar especificamente o atendente "gionava"
    const gionava = await prisma.attendant.findFirst({
      where: {
        name: {
          contains: 'gionava',
          mode: 'insensitive'
        }
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        },
        Tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (gionava) {
      console.log('\n🎯 Status do atendente "gionava":');
      console.log(`   Nome: ${gionava.name}`);
      console.log(`   Email: ${gionava.email}`);
      console.log(`   AdminId: ${gionava.adminId}`);
      console.log(`   Admin: ${gionava.admin?.name || 'N/A'}`);
      console.log(`   TenantId: ${gionava.tenantId}`);
      console.log(`   Tenant: ${gionava.Tenant?.name || 'N/A'}`);
      console.log(`   Status: ${gionava.isActive ? 'Ativo' : 'Inativo'}`);
      
      const isCorrectlyAssociated = gionava.admin?.name?.includes('Adlux') && gionava.Tenant?.name?.includes('Adlux');
      console.log(`   Associação: ${isCorrectlyAssociated ? '✅ Correta' : '❌ Incorreta'}`);
    } else {
      console.log('\n❌ Atendente "gionava" não encontrado');
    }
    
    // 4. Resumo final
    const totalAttendants = await prisma.attendant.count({ where: { isActive: true } });
    const correctlyAssociated = await prisma.attendant.count({
      where: {
        isActive: true,
        adminId: { not: null },
        tenantId: { not: null }
      }
    });
    
    console.log('\n📈 Resumo:');
    console.log(`   Total de atendentes ativos: ${totalAttendants}`);
    console.log(`   Corretamente associados: ${correctlyAssociated}`);
    console.log(`   Órfãos: ${totalAttendants - correctlyAssociated}`);
    console.log(`   Taxa de sucesso: ${((correctlyAssociated / totalAttendants) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAttendantAssociations();