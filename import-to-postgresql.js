const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importDataToPostgreSQL() {
  console.log('🔄 Iniciando importação dos dados para PostgreSQL...');
  
  try {
    // Verificar se o diretório de backup existe
    const backupDir = path.join(__dirname, 'mysql-backup');
    if (!fs.existsSync(backupDir)) {
      console.error('❌ Diretório de backup não encontrado:', backupDir);
      return;
    }

    // Ler o backup completo
    const fullBackupPath = path.join(backupDir, 'full-backup.json');
    if (!fs.existsSync(fullBackupPath)) {
      console.error('❌ Arquivo de backup completo não encontrado:', fullBackupPath);
      return;
    }

    const backupData = JSON.parse(fs.readFileSync(fullBackupPath, 'utf8'));
    console.log('✅ Backup carregado com sucesso!');

    // Ordem de importação (respeitando dependências)
    const importOrder = [
      'tenant',
      'department',
      'position', 
      'function',
      'user',
      'attendant',
      'column',
      'lead',
      'attendance',
      'rating',
      'integration',
      'systemSettings'
    ];

    let totalImported = 0;

    for (const tableName of importOrder) {
      if (!backupData[tableName] || backupData[tableName].length === 0) {
        console.log(`⏭️  Pulando ${tableName}: sem dados`);
        continue;
      }

      console.log(`\n📋 Importando ${tableName}...`);
      const records = backupData[tableName];
      
      try {
        for (const record of records) {
          // Remover campos que podem causar conflito
          const cleanRecord = { ...record };
          
          // Converter datas string para Date objects se necessário
          if (cleanRecord.createdAt && typeof cleanRecord.createdAt === 'string') {
            cleanRecord.createdAt = new Date(cleanRecord.createdAt);
          }
          if (cleanRecord.updatedAt && typeof cleanRecord.updatedAt === 'string') {
            cleanRecord.updatedAt = new Date(cleanRecord.updatedAt);
          }
          if (cleanRecord.deletedAt && typeof cleanRecord.deletedAt === 'string') {
            cleanRecord.deletedAt = new Date(cleanRecord.deletedAt);
          }
          if (cleanRecord.scheduledAt && typeof cleanRecord.scheduledAt === 'string') {
            cleanRecord.scheduledAt = new Date(cleanRecord.scheduledAt);
          }
          if (cleanRecord.completedAt && typeof cleanRecord.completedAt === 'string') {
            cleanRecord.completedAt = new Date(cleanRecord.completedAt);
          }

          // Importar baseado no tipo de tabela
          switch(tableName) {
            case 'tenant':
              await prisma.tenant.create({ data: cleanRecord });
              break;
            case 'user':
              await prisma.user.create({ data: cleanRecord });
              break;
            case 'department':
              await prisma.department.create({ data: cleanRecord });
              break;
            case 'position':
              await prisma.position.create({ data: cleanRecord });
              break;
            case 'function':
              await prisma.function.create({ data: cleanRecord });
              break;
            case 'attendant':
              await prisma.attendant.create({ data: cleanRecord });
              break;
            case 'column':
              await prisma.column.create({ data: cleanRecord });
              break;
            case 'lead':
              await prisma.lead.create({ data: cleanRecord });
              break;
            case 'attendance':
              await prisma.attendance.create({ data: cleanRecord });
              break;
            case 'rating':
              await prisma.rating.create({ data: cleanRecord });
              break;
            case 'integration':
              await prisma.integration.create({ data: cleanRecord });
              break;
            case 'systemSettings':
              await prisma.systemSettings.create({ data: cleanRecord });
              break;
          }
        }
        
        console.log(`✅ ${tableName}: ${records.length} registros importados`);
        totalImported += records.length;
        
      } catch (error) {
        console.error(`❌ Erro ao importar ${tableName}:`, error.message);
        // Continuar com as próximas tabelas mesmo se uma falhar
      }
    }

    console.log('\n🎉 Importação concluída!');
    console.log(`📊 Total de registros importados: ${totalImported}`);
    
    // Verificar dados importados
    console.log('\n🔍 Verificando dados importados:');
    const userCount = await prisma.user.count();
    const leadCount = await prisma.lead.count();
    const attendantCount = await prisma.attendant.count();
    
    console.log(`   Usuários: ${userCount}`);
    console.log(`   Leads: ${leadCount}`);
    console.log(`   Atendentes: ${attendantCount}`);
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importDataToPostgreSQL();