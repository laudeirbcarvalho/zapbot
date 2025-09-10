const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createHierarchyTestData() {
  try {
    console.log('🚀 Criando dados de teste para hierarquia...');

    // 1. Criar Administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'João Administrador',
        email: 'admin@teste.com',
        password: adminPassword,
        userType: 'ADMIN',
        isSuperAdmin: false,
        isActive: true
      }
    });
    console.log('✅ Administrador criado:', admin.email);

    // 2. Criar Gerente associado ao Administrador
    const managerPassword = await bcrypt.hash('gerente123', 10);
    const manager = await prisma.user.create({
      data: {
        name: 'Maria Gerente',
        email: 'gerente@teste.com',
        password: managerPassword,
        userType: 'MANAGER',
        adminId: admin.id,
        isSuperAdmin: false,
        isActive: true
      }
    });
    console.log('✅ Gerente criado:', manager.email);

    // 3. Criar Atendente associado ao Gerente e Administrador
    const attendantPassword = await bcrypt.hash('atendente123', 10);
    const attendant = await prisma.attendant.create({
      data: {
        name: 'Carlos Atendente',
        email: 'atendente@teste.com',
        password: attendantPassword,
        phone: '(11) 99999-9999',
        managerId: manager.id,
        adminId: admin.id,
        startTime: '08:00',
        endTime: '18:00',
        workDays: '1,2,3,4,5',
        canLogin: true,
        isActive: true
      }
    });
    console.log('✅ Atendente criado:', attendant.email);

    // 4. Criar Lead associado ao Atendente
    const lead = await prisma.lead.create({
      data: {
        name: 'Ana Cliente',
        email: 'cliente@teste.com',
        phone: '(11) 88888-8888',
        source: 'Website',
        status: 'novo',
        notes: 'Lead de teste para hierarquia',
        attendantId: attendant.id,
        createdBy: manager.id
      }
    });
    console.log('✅ Lead criado:', lead.name);

    // 5. Criar Atendimento associado ao Lead
    const attendance = await prisma.attendance.create({
      data: {
        leadId: lead.id,
        userId: manager.id,
        type: 'call',
        subject: 'Primeiro contato',
        description: 'Atendimento de teste para hierarquia',
        status: 'completed',
        priority: 'medium',
        scheduledAt: new Date(),
        completedAt: new Date(),
        duration: 30,
        outcome: 'successful'
      }
    });
    console.log('✅ Atendimento criado:', attendance.subject);

    console.log('\n🎉 Hierarquia de teste criada com sucesso!');
    console.log('\n📋 CREDENCIAIS PARA TESTE:');
    console.log('\n👨‍💼 ADMINISTRADOR:');
    console.log('Email: admin@teste.com');
    console.log('Senha: admin123');
    console.log('\n👩‍💼 GERENTE:');
    console.log('Email: gerente@teste.com');
    console.log('Senha: gerente123');
    console.log('\n👨‍💻 ATENDENTE:');
    console.log('Email: atendente@teste.com');
    console.log('Senha: atendente123');
    console.log('\n🔗 HIERARQUIA:');
    console.log(`Admin (${admin.name}) → Gerente (${manager.name}) → Atendente (${attendant.name}) → Lead (${lead.name}) → Atendimento (${attendance.subject})`);

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createHierarchyTestData();