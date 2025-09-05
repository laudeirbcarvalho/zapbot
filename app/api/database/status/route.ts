import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mysql from 'mysql2/promise';

// Configurações do banco de dados
const DB_CONFIG = {
  host: process.env.DB_HOST || 'w840wgss0o0880ogkg8oss0w',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'mysql',
  password: process.env.DB_PASS || '5frr1t5s9FSQstPoAOQl6YqRnzzAsgROMf8q51g367wycnnEQg3gpnq4L3rmcT0b',
  database: process.env.DB_NAME || 'default'
};

interface ConnectionResult {
  isConnected: boolean;
  error?: string;
  method?: string;
  details?: {
    host: string;
    port: number;
    database: string;
    user: string;
  };
  tables?: string[];
  userCount?: number;
}

async function testPrismaConnection(): Promise<ConnectionResult> {
  console.log('🔍 [DATABASE STATUS] Testando conexão via Prisma...');
  
  // Usando prisma centralizado
  
  try {
    await prisma.$connect();
    console.log('✅ [DATABASE STATUS] Prisma conectado com sucesso!');
    
    // Testar uma query simples
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ [DATABASE STATUS] Query de teste executada com sucesso');
    
    // Verificar se a tabela users existe e contar usuários
    let userCount = 0;
    try {
      const users = await prisma.user.count();
      userCount = users;
      console.log(`✅ [DATABASE STATUS] Tabela users encontrada com ${userCount} usuários`);
    } catch (error) {
      console.log('⚠️ [DATABASE STATUS] Tabela users não encontrada:', (error as Error).message);
    }
    
    await prisma.$disconnect();
    
    return {
      isConnected: true,
      method: 'Prisma',
      details: DB_CONFIG,
      userCount
    };
    
  } catch (error) {
    console.error('❌ [DATABASE STATUS] Erro na conexão Prisma:', (error as Error).message);
    await prisma.$disconnect();
    
    return {
      isConnected: false,
      error: `Prisma: ${(error as Error).message}`,
      method: 'Prisma',
      details: DB_CONFIG
    };
  }
}

async function testDirectMySQLConnection(): Promise<ConnectionResult> {
  console.log('🔍 [DATABASE STATUS] Testando conexão MySQL direta...');
  
  try {
    const connection = await mysql.createConnection({
      ...DB_CONFIG,
      connectTimeout: 5000, // 5 segundos de timeout
      acquireTimeout: 5000,
      timeout: 5000
    });
    
    console.log('✅ [DATABASE STATUS] MySQL conectado diretamente com sucesso!');
    
    // Testar query simples
    await connection.execute('SELECT 1 as test');
    console.log('✅ [DATABASE STATUS] Query de teste executada com sucesso');
    
    // Listar tabelas
    const [tables] = await connection.execute('SHOW TABLES') as any[];
    const tableNames = tables.map((table: any) => Object.values(table)[0] as string);
    console.log(`✅ [DATABASE STATUS] ${tableNames.length} tabelas encontradas:`, tableNames);
    
    // Verificar se existe tabela users e contar
    let userCount = 0;
    const [userTables] = await connection.execute("SHOW TABLES LIKE 'users'") as any[];
    if (userTables.length > 0) {
      const [userCountResult] = await connection.execute('SELECT COUNT(*) as count FROM users') as any[];
      userCount = userCountResult[0].count;
      console.log(`✅ [DATABASE STATUS] Tabela users encontrada com ${userCount} usuários`);
    } else {
      console.log('⚠️ [DATABASE STATUS] Tabela users não encontrada');
    }
    
    await connection.end();
    
    return {
      isConnected: true,
      method: 'MySQL Direct',
      details: DB_CONFIG,
      tables: tableNames,
      userCount
    };
    
  } catch (error) {
    console.error('❌ [DATABASE STATUS] Erro na conexão MySQL direta:', (error as Error).message);
    console.error('📋 [DATABASE STATUS] Código do erro:', (error as any).code);
    
    return {
      isConnected: false,
      error: `MySQL Direct: ${(error as Error).message} (Código: ${(error as any).code || 'N/A'})`,
      method: 'MySQL Direct',
      details: DB_CONFIG
    };
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 [DATABASE STATUS] Iniciando verificação de status do banco de dados...');
  
  try {
    // Tentar primeiro com Prisma
    const prismaResult = await testPrismaConnection();
    
    if (prismaResult.isConnected) {
      console.log('✅ [DATABASE STATUS] Conexão bem-sucedida via Prisma');
      return NextResponse.json(prismaResult);
    }
    
    // Se Prisma falhar, tentar conexão direta
    console.log('⚠️ [DATABASE STATUS] Prisma falhou, tentando conexão direta...');
    const directResult = await testDirectMySQLConnection();
    
    if (directResult.isConnected) {
      console.log('✅ [DATABASE STATUS] Conexão bem-sucedida via MySQL direto');
      return NextResponse.json(directResult);
    }
    
    // Se ambos falharem, retornar o erro mais detalhado
    console.log('❌ [DATABASE STATUS] Todas as tentativas de conexão falharam');
    return NextResponse.json({
      isConnected: false,
      error: `Falha em ambas as conexões:\n- ${prismaResult.error}\n- ${directResult.error}`,
      details: DB_CONFIG,
      prismaError: prismaResult.error,
      directError: directResult.error
    }, { status: 500 });
    
  } catch (error) {
    console.error('💥 [DATABASE STATUS] Erro inesperado:', error);
    return NextResponse.json({
      isConnected: false,
      error: `Erro inesperado: ${(error as Error).message}`,
      details: DB_CONFIG
    }, { status: 500 });
  }
}