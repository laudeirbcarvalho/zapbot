const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function testPrismaConnection() {
  console.log('=== TESTE DE CONEXÃO PRISMA ===');
  try {
    await prisma.$connect();
    console.log('✅ Conexão Prisma estabelecida com sucesso');
    
    // Testar consulta simples
    const users = await prisma.user.findMany({
      select: { email: true, name: true }
    });
    console.log('📋 Usuários encontrados:', users);
    
    // Verificar usuário específico
    const specificUser = await prisma.user.findUnique({
      where: { email: 'ti@adlux.com.br' }
    });
    console.log('🔍 Usuário ti@adlux.com.br:', specificUser ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    if (specificUser) {
      console.log('   - Email:', specificUser.email);
      console.log('   - Nome:', specificUser.name);
      console.log('   - Hash da senha:', specificUser.password);
      console.log('   - Comprimento do hash:', specificUser.password.length);
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão Prisma:', error.message);
    console.error('❌ Código do erro:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

async function testDirectMySQLConnection() {
  console.log('\n=== TESTE DE CONEXÃO MYSQL DIRETA ===');
  try {
    const connection = await mysql.createConnection({
      host: '31.97.83.151',
      port: 3306,
      user: 'mysql',
      password: '5frr1t5s9FSQstPoAOQl6YqRnzzAsgROMf8q51g367wycnnEQg3gpnq4L3rmcT0b',
      database: 'default'
    });
    
    console.log('✅ Conexão MySQL direta estabelecida');
    
    // Testar consulta
    const [rows] = await connection.execute('SELECT email, name, password FROM users');
    console.log('📋 Usuários (MySQL direto):', rows);
    
    // Verificar usuário específico
    const [specificRows] = await connection.execute(
      'SELECT email, name, password FROM users WHERE email = ?',
      ['ti@adlux.com.br']
    );
    console.log('🔍 Usuário ti@adlux.com.br (MySQL direto):', specificRows);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro na conexão MySQL direta:', error.message);
    console.error('❌ Código do erro:', error.code);
  }
}

async function main() {
  console.log('🔍 Testando conexões com banco de dados...');
  console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL);
  
  await testPrismaConnection();
  await testDirectMySQLConnection();
}

main().catch(console.error);