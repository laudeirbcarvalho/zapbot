const { seedDepartments } = require('./seed-departments');
const { seedPositions } = require('./seed-positions');
const { seedFunctions } = require('./seed-functions');
const { seedIntegrations } = require('./seed-integrations');

async function seedAllDefaults() {
  console.log('🚀 Iniciando seed de todos os dados padrão...');
  
  try {
    // Executar seeds em sequência
    await seedDepartments();
    await seedPositions();
    await seedFunctions();
    await seedIntegrations();
    
    console.log('🎉 Todos os dados padrão foram criados com sucesso!');
    console.log('');
    console.log('📊 Dados criados:');
    console.log('  ✅ Departamentos padrão');
    console.log('  ✅ Cargos padrão');
    console.log('  ✅ Funções padrão');
    console.log('  ✅ Integrações padrão');
    console.log('');
    console.log('💡 Estes dados estarão disponíveis em todas as novas instalações.');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAllDefaults();
}

module.exports = { seedAllDefaults };