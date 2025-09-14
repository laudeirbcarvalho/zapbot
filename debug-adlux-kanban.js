const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAdluxKanban() {
  try {
    console.log('🔍 Debugando Kanban da Adlux Cosméticos...');
    
    // Buscar tenant Adlux
    const adluxTenant = await prisma.tenant.findFirst({
      where: {
        name: 'Adlux Cosméticos'
      }
    });
    
    if (!adluxTenant) {
      console.log('❌ Tenant Adlux Cosméticos não encontrado');
      return;
    }
    
    console.log(`📋 Tenant Adlux: ${adluxTenant.name} (ID: ${adluxTenant.id})`);
    
    // Buscar admin da Adlux
    const adluxAdmin = await prisma.user.findFirst({
      where: {
        tenantId: adluxTenant.id,
        userType: 'ADMIN'
      }
    });
    
    if (!adluxAdmin) {
      console.log('❌ Admin da Adlux não encontrado');
      return;
    }
    
    console.log(`👤 Admin Adlux: ${adluxAdmin.name} (${adluxAdmin.email})`);
    
    // Buscar todos os leads que aparecem no Kanban
    const allLeads = await prisma.lead.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: 'Maria Santos' },
          { name: 'Ana Costa' },
          { name: 'Cliente Teste' }
        ]
      },
      include: {
        attendant: {
          select: {
            id: true,
            name: true,
            tenantId: true,
            managerId: true,
            adminId: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            tenantId: true
          }
        }
      }
    });
    
    console.log(`\n📊 Leads encontrados: ${allLeads.length}`);
    
    for (const lead of allLeads) {
      console.log(`\n🔸 Lead: ${lead.name}`);
      console.log(`  - ID: ${lead.id}`);
      console.log(`  - TenantId: ${lead.tenantId}`);
      console.log(`  - AttendantId: ${lead.attendantId}`);
      console.log(`  - CreatedBy: ${lead.createdBy}`);
      
      if (lead.attendant) {
        console.log(`  - Atendente: ${lead.attendant.name}`);
        console.log(`  - Atendente TenantId: ${lead.attendant.tenantId}`);
        console.log(`  - Atendente ManagerId: ${lead.attendant.managerId}`);
        console.log(`  - Atendente AdminId: ${lead.attendant.adminId}`);
      }
      
      if (lead.creator) {
        console.log(`  - Criador: ${lead.creator.name}`);
        console.log(`  - Criador TenantId: ${lead.creator.tenantId}`);
      }
      
      // Verificar se este lead deveria aparecer para o admin da Adlux
      const shouldBeVisible = (
        lead.tenantId === adluxTenant.id && (
          lead.createdBy === adluxAdmin.id ||
          (lead.attendant && (
            lead.attendant.adminId === adluxAdmin.id ||
            lead.attendant.tenantId === adluxTenant.id
          ))
        )
      );
      
      console.log(`  - Deveria ser visível para Adlux: ${shouldBeVisible ? '✅ SIM' : '❌ NÃO'}`);
      
      if (!shouldBeVisible && lead.tenantId !== adluxTenant.id) {
        console.log(`  - ⚠️ PROBLEMA: Lead de tenant diferente (${lead.tenantId}) aparecendo para Adlux`);
      }
      
      if (!shouldBeVisible && lead.attendant && lead.attendant.tenantId !== adluxTenant.id) {
        console.log(`  - ⚠️ PROBLEMA: Atendente de tenant diferente (${lead.attendant.tenantId}) associado ao lead`);
      }
    }
    
    // Verificar atendentes da Adlux
    console.log('\n👥 Atendentes da Adlux:');
    const adluxAttendants = await prisma.attendant.findMany({
      where: {
        tenantId: adluxTenant.id
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        managerId: true,
        adminId: true
      }
    });
    
    adluxAttendants.forEach(att => {
      console.log(`  - ${att.name} (ID: ${att.id}, TenantId: ${att.tenantId})`);
    });
    
    // Verificar atendentes de outros tenants
    console.log('\n👥 Atendentes de outros tenants:');
    const otherAttendants = await prisma.attendant.findMany({
      where: {
        tenantId: { not: adluxTenant.id }
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        managerId: true,
        adminId: true
      }
    });
    
    otherAttendants.forEach(att => {
      console.log(`  - ${att.name} (ID: ${att.id}, TenantId: ${att.tenantId})`);
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdluxKanban();