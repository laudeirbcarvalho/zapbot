const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Dados do usuário padrão
  const email = 'ti@adlux.com.br';
  const password = '197755Jesus*';
  const name = 'Administrador';

  // Verificar se o usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Usuário com email ${email} já existe.`);
    return;
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar o usuário
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  console.log(`Usuário criado com sucesso: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });