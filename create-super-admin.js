const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Criando Super Admin...');

    // Verificar se já existe
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        isSuperAdmin: true
      }
    });

    if (existingSuperAdmin) {
      console.log('✅ Super Admin já existe:', existingSuperAdmin.email);
      return;
    }

    // Criar senha hash
    const password = await bcrypt.hash('superadmin123', 10);

    // Criar Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrador',
        email: 'superadmin@sistema.com',
        password: password,
        userType: 'ADMIN',
        isSuperAdmin: true,
        isActive: true
      }
    });

    console.log('✅ Super Admin criado com sucesso!');
    console.log('\n📋 CREDENCIAIS DO SUPER ADMIN:');
    console.log('Email: superadmin@sistema.com');
    console.log('Senha: superadmin123');
    console.log('\n🔑 O Super Admin pode:');
    console.log('- Acessar todos os tenants');
    console.log('- Fazer login sem especificar tenant slug');
    console.log('- Gerenciar todo o sistema');
    
  } catch (error) {
    console.error('❌ Erro ao criar Super Admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();