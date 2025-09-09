const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function diagnoseNetworkConnectivity() {
  console.log('🔍 Diagnóstico de Conectividade de Rede');
  console.log('=====================================\n');
  
  const hostname = 'voog08koo888k804w880o4cc';
  const port = 5432;
  
  console.log(`🎯 Testando conectividade para: ${hostname}:${port}\n`);
  
  // Teste 1: Ping
  console.log('1️⃣ Testando PING...');
  try {
    const { stdout } = await execAsync(`ping -n 4 ${hostname}`);
    console.log('✅ PING bem-sucedido:');
    console.log(stdout.split('\n').slice(0, 6).join('\n'));
  } catch (error) {
    console.log('❌ PING falhou:');
    console.log(error.stdout || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 2: NSLookup
  console.log('2️⃣ Testando resolução DNS (nslookup)...');
  try {
    const { stdout } = await execAsync(`nslookup ${hostname}`);
    console.log('✅ DNS resolvido:');
    console.log(stdout);
  } catch (error) {
    console.log('❌ Resolução DNS falhou:');
    console.log(error.stdout || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 3: Telnet (teste de porta)
  console.log('3️⃣ Testando conectividade da porta...');
  try {
    // No Windows, usamos Test-NetConnection via PowerShell
    const { stdout } = await execAsync(`powershell "Test-NetConnection -ComputerName ${hostname} -Port ${port} -InformationLevel Detailed"`);
    console.log('✅ Teste de porta:');
    console.log(stdout);
  } catch (error) {
    console.log('❌ Teste de porta falhou:');
    console.log(error.stdout || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 4: Traceroute
  console.log('4️⃣ Testando rota de rede (tracert)...');
  try {
    const { stdout } = await execAsync(`tracert -h 10 ${hostname}`);
    console.log('✅ Traceroute:');
    console.log(stdout.split('\n').slice(0, 15).join('\n'));
  } catch (error) {
    console.log('❌ Traceroute falhou:');
    console.log(error.stdout || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Resumo e recomendações
  console.log('📋 RESUMO E RECOMENDAÇÕES:');
  console.log('');
  console.log('Se todos os testes falharam:');
  console.log('  ❌ O hostname pode estar incorreto');
  console.log('  ❌ O servidor pode estar offline');
  console.log('  ❌ Pode haver bloqueio de firewall');
  console.log('  ❌ Pode ser necessário VPN ou acesso especial');
  console.log('');
  console.log('Próximos passos sugeridos:');
  console.log('  1. Verificar com o provedor se o hostname está correto');
  console.log('  2. Confirmar se o servidor PostgreSQL está rodando');
  console.log('  3. Verificar se há restrições de IP ou firewall');
  console.log('  4. Testar de uma rede diferente');
  console.log('  5. Considerar usar um servidor PostgreSQL alternativo');
  console.log('');
  console.log('💡 Alternativas:');
  console.log('  - Usar PostgreSQL local via Docker');
  console.log('  - Usar serviços cloud: Supabase, Railway, Neon, etc.');
  console.log('  - Configurar PostgreSQL local no Windows');
}

diagnoseNetworkConnectivity().catch(console.error);