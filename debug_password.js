const bcrypt = require('bcryptjs');

async function debugPassword() {
  const password = '197755Jesus*';
  
  console.log('=== DEBUG DE SENHA ===');
  console.log('Senha original:', password);
  
  // Gerar novo hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('Novo hash gerado:', newHash);
  
  // Testar se o hash funciona
  const isValid = await bcrypt.compare(password, newHash);
  console.log('Hash válido:', isValid);
  
  // Testar hashes comuns que podem estar no banco
  const commonHashes = [
    '$2b$10$4DN9ONVk.zKNMB8X4IuTVOS2UBWb1V6LQ/HKRYiOU6PF1q6rSxat2',
    '$2a$10$4DN9ONVk.zKNMB8X4IuTVOS2UBWb1V6LQ/HKRYiOU6PF1q6rSxat2',
    '$2y$10$4DN9ONVk.zKNMB8X4IuTVOS2UBWb1V6LQ/HKRYiOU6PF1q6rSxat2'
  ];
  
  console.log('\n=== TESTANDO HASHES EXISTENTES ===');
  for (let i = 0; i < commonHashes.length; i++) {
    const hash = commonHashes[i];
    const valid = await bcrypt.compare(password, hash);
    console.log(`Hash ${i + 1}: ${valid ? 'VÁLIDO' : 'INVÁLIDO'}`);
    console.log(`  ${hash}`);
  }
  
  console.log('\n=== COMANDO SQL PARA ATUALIZAR ===');
  console.log(`UPDATE users SET password = '${newHash}' WHERE email = 'ti@adlux.com.br';`);
  console.log('SELECT email, password FROM users WHERE email = \'ti@adlux.com.br\';');
}

debugPassword().catch(console.error);