import bcrypt from 'bcryptjs';

// Dados de fallback quando o MySQL não estiver disponível
const fallbackUsers = [
  {
    id: '1',
    email: 'ti@adlux.com.br',
    name: 'Administrador',
    password: '$2b$10$4DN9ONVk.zKNMB8X4IuTVOS2UBWb1V6LQ/HKRYiOU6PF1q6rSxat2' // admin123
  },
  {
    id: '2',
    email: 'admin@zapbot.com',
    name: 'Admin ZapBot',
    password: '$2b$10$4DN9ONVk.zKNMB8X4IuTVOS2UBWb1V6LQ/HKRYiOU6PF1q6rSxat2' // admin123
  }
];

export async function authenticateWithFallback(email: string, password: string) {
  console.log('🔄 Usando sistema de fallback para autenticação');
  console.log('🔍 Procurando usuário:', email);
  
  const user = fallbackUsers.find(u => u.email === email);
  
  if (!user) {
    console.log('❌ Usuário não encontrado no fallback');
    console.log('📋 Usuários disponíveis:', fallbackUsers.map(u => u.email));
    return null;
  }
  
  console.log('✅ Usuário encontrado no fallback:', user.email);
  console.log('🔍 Testando senha...');
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('🔍 Resultado da comparação:', isPasswordValid);
  
  if (!isPasswordValid) {
    console.log('❌ Senha inválida');
    return null;
  }
  
  console.log('✅ Login bem-sucedido com fallback!');
  return {
    id: user.id,
    email: user.email,
    name: user.name
  };
}

export async function checkDatabaseConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('❌ Banco de dados não disponível:', error.message);
    return false;
  }
}