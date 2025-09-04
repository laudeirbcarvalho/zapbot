const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

// Configurações do banco de dados
const DB_CONFIG = {
  host: '31.97.83.151',
  port: 3306,
  user: 'mysql',
  password: '5frr1t5s9FSQstPoAOQl6YqRnzzAsgROMf8q51g367wycnnEQg3gpnq4L3rmcT0b',
  database: 'default'
};

const DATABASE_URL = 'mysql://mysql:5frr1t5s9FSQstPoAOQl6YqRnzzAsgROMf8q51g367wycnnEQg3gpnq4L3rmcT0b@31.97.83.151:3306/default';

async function testPrismaConnection() {
  console.log('🔍 Testando conexão via Prisma...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Prisma conectado com sucesso!');
    
    // Testar uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste executada:', result);
    
    // Verificar se a tabela users existe
    try {
      const users = await prisma.user.findMany({ take: 1 });
      console.log('✅ Tabela users encontrada. Total de usuários:', users.length);
      if (users.length > 0) {
        console.log('👤 Primeiro usuário:', { id: users[0].id, email: users[0].email });
      }
    } catch (error) {
      console.log('⚠️ Tabela users não encontrada ou erro:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão Prisma:', error.message);
    console.error('📋 Detalhes do erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testDirectMySQLConnection() {
  console.log('\n🔍 Testando conexão MySQL direta...');
  
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ MySQL conectado diretamente com sucesso!');
    
    // Testar query simples
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query de teste executada:', rows);
    
    // Listar tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tabelas encontradas:', tables.length);
    tables.forEach(table => {
      console.log('  - ', Object.values(table)[0]);
    });
    
    // Verificar se existe tabela users
    const [userTables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (userTables.length > 0) {
      console.log('✅ Tabela users encontrada!');
      
      // Contar usuários
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log('👥 Total de usuários:', userCount[0].count);
      
      // Listar alguns usuários
      const [users] = await connection.execute('SELECT id, email FROM users LIMIT 3');
      console.log('👤 Usuários encontrados:');
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}`);
      });
    } else {
      console.log('⚠️ Tabela users não encontrada');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro na conexão MySQL direta:', error.message);
    console.error('📋 Código do erro:', error.code);
    console.error('📋 Detalhes completos:', error);
  }
}

async function testDatabaseInfo() {
  console.log('\n📊 Informações da configuração:');
  console.log('🔗 DATABASE_URL:', DATABASE_URL);
  console.log('🏠 Host:', DB_CONFIG.host);
  console.log('🚪 Porta:', DB_CONFIG.port);
  console.log('👤 Usuário:', DB_CONFIG.user);
  console.log('🗄️ Database:', DB_CONFIG.database);
  console.log('🔑 Senha:', DB_CONFIG.password.substring(0, 10) + '...');
}

async function main() {
  console.log('🚀 Iniciando testes de conexão com MySQL...');
  console.log('=' .repeat(50));
  
  testDatabaseInfo();
  
  await testPrismaConnection();
  await testDirectMySQLConnection();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Testes de conexão finalizados!');
}

main().catch(console.error);