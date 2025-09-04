const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configurar Prisma para MySQL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Função para migrar dados do SQLite para MySQL
async function migrateData() {
  console.log('🔄 Iniciando migração de dados do SQLite para MySQL...');
  
  try {
    // Conectar ao banco SQLite
    const sqliteDb = new sqlite3.Database('./prisma/dev.db');
    
    // Função para executar query no SQLite
    const sqliteQuery = (query) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(query, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };
    
    console.log('📊 Migrando usuários...');
    // Migrar usuários
    const users = await sqliteQuery('SELECT * FROM User');
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          password: user.password,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    console.log(`✅ ${users.length} usuários migrados`);
    
    console.log('📋 Migrando colunas...');
    // Migrar colunas
    const columns = await sqliteQuery('SELECT * FROM Column ORDER BY position');
    for (const column of columns) {
      await prisma.column.upsert({
        where: { id: column.id },
        update: {
          title: column.title,
          position: column.position,
          createdAt: new Date(column.createdAt),
          updatedAt: new Date(column.updatedAt)
        },
        create: {
          id: column.id,
          title: column.title,
          position: column.position,
          createdAt: new Date(column.createdAt),
          updatedAt: new Date(column.updatedAt)
        }
      });
    }
    console.log(`✅ ${columns.length} colunas migradas`);
    
    console.log('👥 Migrando leads...');
    // Migrar leads
    const leads = await sqliteQuery('SELECT * FROM Lead ORDER BY position');
    for (const lead of leads) {
      await prisma.lead.upsert({
        where: { id: lead.id },
        update: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          notes: lead.notes,
          columnId: lead.columnId,
          position: lead.position,
          createdAt: new Date(lead.createdAt),
          updatedAt: new Date(lead.updatedAt)
        },
        create: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          notes: lead.notes,
          columnId: lead.columnId,
          position: lead.position,
          createdAt: new Date(lead.createdAt),
          updatedAt: new Date(lead.updatedAt)
        }
      });
    }
    console.log(`✅ ${leads.length} leads migrados`);
    
    console.log('🔗 Migrando integrações...');
    // Migrar integrações
    const integrations = await sqliteQuery('SELECT * FROM Integration');
    for (const integration of integrations) {
      await prisma.integration.upsert({
        where: { id: integration.id },
        update: {
          name: integration.name,
          type: integration.type,
          config: integration.config,
          createdAt: new Date(integration.createdAt),
          updatedAt: new Date(integration.updatedAt)
        },
        create: {
          id: integration.id,
          name: integration.name,
          type: integration.type,
          config: integration.config,
          createdAt: new Date(integration.createdAt),
          updatedAt: new Date(integration.updatedAt)
        }
      });
    }
    console.log(`✅ ${integrations.length} integrações migradas`);
    
    // Fechar conexões
    sqliteDb.close();
    await prisma.$disconnect();
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('📊 Resumo da migração:');
    console.log(`   - ${users.length} usuários`);
    console.log(`   - ${columns.length} colunas`);
    console.log(`   - ${leads.length} leads`);
    console.log(`   - ${integrations.length} integrações`);
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };