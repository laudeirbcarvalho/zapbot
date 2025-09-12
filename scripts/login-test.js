const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function loginTest() {
  try {
    // Buscar o usuário admin
    const user = await prisma.user.findUnique({
      where: { email: 'admin@zapbot.com' },
      include: {
        tenant: true
      }
    });

    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare('123456', user.password);
    
    if (!isValidPassword) {
      console.log('Senha inválida');
      return;
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        isSuperAdmin: user.isSuperAdmin,
        tenantId: user.tenantId,
        tenantSlug: user.tenant?.slug
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log('Login realizado com sucesso!');
    console.log('Token JWT:', token);
    console.log('\nPara usar no navegador, execute no console:');
    console.log(`localStorage.setItem('token', '${token}');`);
    console.log('window.location.reload();');

  } catch (error) {
    console.error('Erro no login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loginTest();