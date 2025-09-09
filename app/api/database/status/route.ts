import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface ConnectionResult {
  isConnected: boolean;
  error?: string;
  method?: string;
  userCount?: number;
  tablesCount?: number;
}

async function testPrismaConnection(): Promise<ConnectionResult> {
  console.log('🔍 [DATABASE STATUS] Testando conexão via Prisma...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ [DATABASE STATUS] Prisma conectado com sucesso!');
    
    // Testar uma query simples
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ [DATABASE STATUS] Query de teste executada com sucesso');
    
    // Verificar se a tabela users existe e contar usuários
    let userCount = 0;
    let tablesCount = 0;
    
    try {
      const users = await prisma.user.count();
      userCount = users;
      console.log(`✅ [DATABASE STATUS] Tabela users encontrada com ${userCount} usuários`);
    } catch (error) {
      console.log('⚠️ [DATABASE STATUS] Tabela users não encontrada:', (error as Error).message);
    }
    
    // Contar tabelas usando uma query raw
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = current_database()
      ` as any[];
      tablesCount = Number(result[0]?.count || 0);
      console.log(`✅ [DATABASE STATUS] ${tablesCount} tabelas encontradas no banco`);
    } catch (error) {
      console.log('⚠️ [DATABASE STATUS] Não foi possível contar tabelas:', (error as Error).message);
    }
    
    await prisma.$disconnect();
    
    return {
      isConnected: true,
      method: 'Prisma PostgreSQL',
      userCount,
      tablesCount
    };
    
  } catch (error) {
    console.error('❌ [DATABASE STATUS] Erro na conexão Prisma:', (error as Error).message);
    await prisma.$disconnect();
    
    return {
      isConnected: false,
      error: `Prisma PostgreSQL: ${(error as Error).message}`,
      method: 'Prisma PostgreSQL'
    };
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 [DATABASE STATUS] Iniciando verificação de status do banco PostgreSQL...');
  
  try {
    const result = await testPrismaConnection();
    
    if (result.isConnected) {
      console.log('✅ [DATABASE STATUS] Conexão bem-sucedida com PostgreSQL');
      return NextResponse.json(result);
    } else {
      console.log('❌ [DATABASE STATUS] Falha na conexão com PostgreSQL');
      return NextResponse.json(result, { status: 500 });
    }
    
  } catch (error) {
    console.error('💥 [DATABASE STATUS] Erro inesperado:', error);
    return NextResponse.json({
      isConnected: false,
      error: `Erro inesperado: ${(error as Error).message}`,
      method: 'Prisma PostgreSQL'
    }, { status: 500 });
  }
}