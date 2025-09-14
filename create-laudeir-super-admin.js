const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createLaudeirSuperAdmin() {
  try {
    console.log('🚀 Criando Super Admin Laudeir...');

    // Verificar se já existe um usuário com este email
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'laudeirbcarvalho@gmail.com'
      }
    });

    if (existingUser) {
      console.log('⚠️  Usuário já existe. Atualizando dados...');
      
      // Atualizar usuário existente
      const hashedPassword = await bcrypt.hash('197755Jesus*', 10);
      
      const updatedUser = await prisma.user.update({
        where: {
          email: 'laudeirbcarvalho@gmail.com'
        },
        data: {
          name: 'Laudeir',
          password: hashedPassword,
          userType: 'ADMIN',
          isSuperAdmin: true,
          isActive: true
        }
      });
      
      console.log('✅ Super Admin Laudeir atualizado com sucesso!');
      console.log('📋 Dados atualizados:');
      console.log('   Nome:', updatedUser.name);
      console.log('   Email:', updatedUser.email);
      console.log('   Tipo:', updatedUser.userType);
      console.log('   Super Admin:', updatedUser.isSuperAdmin);
      console.log('   Ativo:', updatedUser.isActive);
      
      return updatedUser;
    }

    // Criar senha hash
    const hashedPassword = await bcrypt.hash('197755Jesus*', 10);
    console.log('🔐 Senha criptografada com sucesso');

    // Criar Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Laudeir',
        email: 'laudeirbcarvalho@gmail.com',
        password: hashedPassword,
        userType: 'ADMIN',
        isSuperAdmin: true,
        isActive: true
      }
    });

    console.log('✅ Super Admin Laudeir criado com sucesso!');
    console.log('\n📋 CREDENCIAIS DO SUPER ADMIN:');
    console.log('Nome: Laudeir');
    console.log('Email: laudeirbcarvalho@gmail.com');
    console.log('Senha: 197755Jesus*');
    console.log('\n🔑 O Super Admin pode:');
    console.log('- Acessar todos os recursos do sistema');
    console.log('- Gerenciar todos os usuários');
    console.log('- Configurar integrações');
    console.log('- Acessar configurações avançadas');
    console.log('\n🌐 Acesso:');
    console.log('URL: http://localhost:3000/login');
    console.log('Email: laudeirbcarvalho@gmail.com');
    console.log('Senha: 197755Jesus*');
    
    return superAdmin;
    
  } catch (error) {
    console.error('❌ Erro ao criar Super Admin Laudeir:', error.message);
    
    // Verificar se é erro de email duplicado
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      console.log('\n💡 Dica: O email já está em uso. Use o script para atualizar o usuário existente.');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  createLaudeirSuperAdmin()
    .then(() => {
      console.log('\n🎉 Processo concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Falha no processo:', error.message);
      process.exit(1);
    });
}

module.exports = createLaudeirSuperAdmin;