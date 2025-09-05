const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedIntegrations() {
  try {
    console.log('🌱 Populando integrações...');
    
    // Verificar se já existem integrações
    const existingIntegrations = await prisma.integration.findMany();
    
    if (existingIntegrations.length > 0) {
      console.log('✅ Integrações já existem no banco de dados');
      return;
    }
    
    // Criar integrações padrão - apenas Evolution API
    const integrations = [
      {
        id: "evolution",
        name: "Evolution API",
        type: "evolution-api",
        config: JSON.stringify({
          status: "disconnected",
          icon: "💬",
          description: "API para WhatsApp Business"
        })
      }
    ];
    
    // Inserir integrações
    for (const integration of integrations) {
      await prisma.integration.create({
        data: integration
      });
      console.log(`✅ Integração ${integration.name} criada`);
    }
    
    console.log('🎉 Integrações populadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao popular integrações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedIntegrations();