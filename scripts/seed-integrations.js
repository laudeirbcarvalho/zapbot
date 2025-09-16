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
    
    // Criar integrações padrão
    const integrations = [
      {
        id: "n8n",
        name: "n8n",
        type: "automation",
        config: JSON.stringify({
          status: "disconnected",
          icon: "🔄",
          description: "Plataforma de automação de workflows"
        })
      },
      {
        id: "google",
        name: "Google",
        type: "auth",
        config: JSON.stringify({
          status: "disconnected",
          icon: "🔍",
          description: "Integração com serviços Google"
        })
      },
      {
        id: "evolution",
        name: "Evolution API",
        type: "messaging",
        config: JSON.stringify({
          status: "disconnected",
          icon: "💬",
          description: "API para WhatsApp Business"
        })
      },
      {
        id: "chatwoot",
        name: "Chatwoot",
        type: "support",
        config: JSON.stringify({
          status: "disconnected",
          icon: "🎯",
          description: "Plataforma de atendimento ao cliente"
        })
      },
      {
        id: "telegram",
        name: "Telegram",
        type: "messaging",
        config: JSON.stringify({
          status: "disconnected",
          icon: "📱",
          description: "Bot do Telegram"
        })
      },
      {
        id: "facebook",
        name: "Facebook",
        type: "social",
        config: JSON.stringify({
          status: "disconnected",
          icon: "📘",
          description: "Integração com Facebook e Instagram"
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

// Executar se chamado diretamente
if (require.main === module) {
  seedIntegrations()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedIntegrations };