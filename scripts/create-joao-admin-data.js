const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando dados para João Administrador...');

  try {
    // Buscar o administrador João
    const joaoAdmin = await prisma.user.findUnique({
      where: { email: 'admin1@empresa.com' }
    });

    if (!joaoAdmin) {
      console.log('❌ Administrador João não encontrado!');
      return;
    }

    console.log('✅ Administrador João encontrado:', joaoAdmin.name);

    // 1. Criar Gerentes para João
    const managers = [];
    for (let i = 1; i <= 3; i++) {
      const managerPassword = await bcrypt.hash('123456', 10);
      const manager = await prisma.user.upsert({
        where: { email: `gerente${i}@empresa.com` },
        update: {},
        create: {
          name: `Gerente ${i} - João`,
          email: `gerente${i}@empresa.com`,
          password: managerPassword,
          userType: 'MANAGER',
          isSuperAdmin: false,
          accountId: joaoAdmin.accountId,
          adminId: joaoAdmin.id,
          isActive: true
        }
      });
      managers.push(manager);
      console.log(`✅ Gerente criado: ${manager.name}`);
    }

    // 2. Criar Atendentes para cada Gerente
    const attendants = [];
    for (let managerIndex = 0; managerIndex < managers.length; managerIndex++) {
      const manager = managers[managerIndex];
      
      for (let i = 1; i <= 2; i++) {
        const attendant = await prisma.attendant.upsert({
          where: { email: `atendente${managerIndex + 1}_${i}@empresa.com` },
          update: {},
          create: {
            name: `Atendente ${managerIndex + 1}.${i}`,
            email: `atendente${managerIndex + 1}_${i}@empresa.com`,
            phone: `(11) 9999-${managerIndex}${i}00`,
            managerId: manager.id,
            adminId: joaoAdmin.id,
            startTime: '08:00',
            endTime: '18:00',
            workDays: '1,2,3,4,5',
            isActive: true
          }
        });
        attendants.push(attendant);
        console.log(`✅ Atendente criado: ${attendant.name} para ${manager.name}`);
      }
    }

    // 3. Criar Leads para cada Atendente
    const leads = [];
    for (let attendantIndex = 0; attendantIndex < attendants.length; attendantIndex++) {
      const attendant = attendants[attendantIndex];
      
      for (let i = 1; i <= 3; i++) {
        const lead = await prisma.lead.create({
          data: {
            name: `Lead ${attendantIndex + 1}.${i}`,
            email: `lead${attendantIndex + 1}_${i}@cliente.com`,
            phone: `(11) 8888-${attendantIndex}${i}00`,
            source: 'Website',
            status: i === 1 ? 'novo' : i === 2 ? 'contato' : 'proposta',
            notes: `Lead criado para teste do atendente ${attendant.name}`,
            attendantId: attendant.id,
            createdBy: managers[Math.floor(attendantIndex / 2)].id
          }
        });
        leads.push(lead);
        console.log(`✅ Lead criado: ${lead.name} para ${attendant.name}`);
      }
    }

    // 4. Criar Atendimentos para cada Lead
    for (let leadIndex = 0; leadIndex < leads.length; leadIndex++) {
      const lead = leads[leadIndex];
      const attendant = attendants[Math.floor(leadIndex / 3)];
      const manager = managers[Math.floor(leadIndex / 6)];
      
      for (let i = 1; i <= 2; i++) {
        const attendance = await prisma.attendance.create({
          data: {
            leadId: lead.id,
            userId: manager.id,
            type: i === 1 ? 'call' : 'email',
            subject: `Atendimento ${i} - ${lead.name}`,
            description: `Descrição do atendimento ${i} para o lead ${lead.name}`,
            status: i === 1 ? 'completed' : 'pending',
            priority: 'medium',
            scheduledAt: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
            duration: i === 1 ? 30 : null,
            outcome: i === 1 ? 'successful' : null
          }
        });
        console.log(`✅ Atendimento criado: ${attendance.subject}`);
      }
    }

    console.log('\n📊 Resumo dos dados criados para João Administrador:');
    console.log(`👥 Gerentes: ${managers.length}`);
    console.log(`🎧 Atendentes: ${attendants.length}`);
    console.log(`📋 Leads: ${leads.length}`);
    console.log(`📞 Atendimentos: ${leads.length * 2}`);
    console.log('\n✅ Dados criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });