const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = '197755Jesus*';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Senha:', password);
    console.log('Hash gerado:', hash);
    
    // Testar se o hash funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash válido:', isValid);
    
    console.log('\n--- SQL para atualizar o usuário ---');
    console.log(`UPDATE User SET password = '${hash}' WHERE email = 'ti@adlux.com.br';`);
    
  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
}

generatePasswordHash();