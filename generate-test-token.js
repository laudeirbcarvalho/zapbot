const jwt = require('jsonwebtoken');

// Gerar um token JWT válido para teste usando um usuário real
const payload = {
  userId: '0fa3f6f5-ccb2-4421-bbec-1795110ad85b', // Super Administrador
  email: 'superadmin@sistema.com',
  userType: 'ADMIN',
  isSuperAdmin: true
};

// Usar o mesmo secret do .env
const secret = 'your-secret-key'; // JWT_SECRET do .env
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('🔑 Token JWT gerado para Super Administrador:');
console.log(token);
console.log('\n📋 Para usar no localStorage:');
console.log(`localStorage.setItem('authToken', '${token}');`);
console.log('\n⏰ Token válido por 24 horas');

// Verificar se o token é válido
try {
  const decoded = jwt.verify(token, secret);
  console.log('\n✅ Token verificado com sucesso:');
  console.log('User ID:', decoded.userId);
  console.log('Email:', decoded.email);
  console.log('User Type:', decoded.userType);
  console.log('Super Admin:', decoded.isSuperAdmin);
  console.log('Expira em:', new Date(decoded.exp * 1000));
} catch (error) {
  console.error('❌ Erro ao verificar token:', error);
}