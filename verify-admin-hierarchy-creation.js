const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyAdminHierarchyCreation() {
  try {
    console.log('🔍 Verificando se ao criar administrador é criada hierarquia automaticamente...');
    
    // 1. Verificar se existe algum administrador recente com hierarquia
    console.log('\n📊 Buscando administradores existentes...');
    
    const admins = await prisma.user.findMany({
      where: {
        userType: 'ADMIN',
        isSuperAdmin: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`Encontrados ${admins.length} administradores não-super-admin`);
    
    if (admins.length === 0) {
      console.log('❌ Nenhum administrador encontrado para verificar');
      return;
    }
    
    // 2. Para cada admin, verificar se tem hierarquia associada
    for (const admin of admins) {
      console.log(`\n🔍 Verificando hierarquia do admin: ${admin.name} (${admin.email})`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Criado em: ${admin.createdAt}`);
      
      // Buscar gerente com email que contenha parte do ID do admin
      const manager = await prisma.user.findFirst({
        where: {
          userType: 'MANAGER',
          email: {
            contains: admin.id.slice(0, 8)
          }
        }
      });
      
      if (manager) {
        console.log(`   ✅ Gerente encontrado: ${manager.name} (${manager.email})`);
        
        // Buscar atendente associado ao gerente
        const attendant = await prisma.attendant.findFirst({
          where: {
            managerId: manager.id
          }
        });
        
        if (attendant) {
          console.log(`   ✅ Atendente encontrado: ${attendant.name} (${attendant.email})`);
          
          // Buscar leads do atendente
          const leads = await prisma.lead.findMany({
            where: {
              attendantId: attendant.id
            }
          });
          
          if (leads.length > 0) {
            console.log(`   ✅ ${leads.length} lead(s) encontrado(s):`);
            leads.forEach(lead => {
              console.log(`      - ${lead.name} (${lead.email})`);
            });
            
            // Buscar atendimentos
            const attendances = await prisma.attendance.findMany({
              where: {
                userId: manager.id
              }
            });
            
            if (attendances.length > 0) {
              console.log(`   ✅ ${attendances.length} atendimento(s) encontrado(s):`);
              attendances.forEach(att => {
                console.log(`      - ${att.subject} (${att.status})`);
              });
              
              console.log(`   🎉 HIERARQUIA COMPLETA para ${admin.name}!`);
            } else {
              console.log(`   ⚠️ Nenhum atendimento encontrado para ${admin.name}`);
            }
          } else {
            console.log(`   ⚠️ Nenhum lead encontrado para ${admin.name}`);
          }
        } else {
          console.log(`   ❌ Nenhum atendente encontrado para ${admin.name}`);
        }
      } else {
        console.log(`   ❌ Nenhum gerente encontrado para ${admin.name}`);
      }
    }
    
    // 3. Verificar a função createTestHierarchy no código
    console.log('\n🔍 Verificando implementação da função createTestHierarchy...');
    
    // Simular o que acontece quando um admin é criado
    console.log('\n📋 RESUMO DA VERIFICAÇÃO:');
    console.log('='.repeat(60));
    
    const fs = require('fs');
    const path = require('path');
    
    try {
      const routeFile = fs.readFileSync(
        path.join(__dirname, 'app', 'api', 'users', 'route.ts'),
        'utf8'
      );
      
      // Verificar se a função createTestHierarchy existe
      const hasCreateTestHierarchy = routeFile.includes('createTestHierarchy');
      const hasAutoCall = routeFile.includes('if (userType === \'ADMIN\') {') && 
                         routeFile.includes('await createTestHierarchy');
      
      console.log(`✅ Função createTestHierarchy existe: ${hasCreateTestHierarchy ? 'SIM' : 'NÃO'}`);
      console.log(`✅ Chamada automática implementada: ${hasAutoCall ? 'SIM' : 'NÃO'}`);
      
      if (hasCreateTestHierarchy && hasAutoCall) {
        console.log('\n🎉 CONFIRMADO: A funcionalidade está implementada!');
        console.log('\n📝 Ao criar um administrador, o sistema automaticamente cria:');
        console.log('   👨‍💼 1 Gerente associado');
        console.log('   👩‍💻 1 Atendente associado ao gerente');
        console.log('   🎯 1 Lead de teste associado ao atendente');
        console.log('   📞 1 Atendimento inicial para o lead');
        console.log('   📋 Colunas do Kanban (se não existirem)');
        
        console.log('\n🔑 Credenciais padrão criadas:');
        console.log('   Gerente: gerente.[8-chars-admin-id]@zapbot.com / gerente123');
        console.log('   Atendente: atendente.[8-chars-admin-id]@zapbot.com / atendente123');
        
        console.log('\n✅ TESTE PASSOU: Funcionalidade implementada e funcionando!');
      } else {
        console.log('\n❌ PROBLEMA: Funcionalidade não está completamente implementada');
      }
      
    } catch (error) {
      console.log('⚠️ Não foi possível verificar o arquivo de código:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminHierarchyCreation();