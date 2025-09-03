const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixKanbanColumns() {
  try {
    console.log('🔧 Iniciando correção das colunas do Kanban...');
    
    // Primeiro, vamos buscar todos os leads para preservar seus dados
    const allLeads = await prisma.lead.findMany();
    console.log(`📊 Encontrados ${allLeads.length} leads para preservar`);
    
    // Deletar todas as colunas existentes (isso também deletará os leads por cascade)
    console.log('🗑️ Removendo colunas antigas...');
    await prisma.column.deleteMany({});
    
    // Criar as colunas corretas na ordem certa
    console.log('✨ Criando colunas corretas...');
    const correctColumns = [
      { id: 'novo', title: 'Novo', position: 0 },
      { id: 'em-contato', title: 'Em contato', position: 1 },
      { id: 'qualificado', title: 'Qualificado', position: 2 },
      { id: 'negociacao', title: 'Negociação', position: 3 },
      { id: 'fechado', title: 'Fechado', position: 4 }
    ];
    
    for (const column of correctColumns) {
      await prisma.column.create({
        data: column
      });
      console.log(`✅ Coluna criada: ${column.title} (posição ${column.position})`);
    }
    
    // Recriar os leads com novos IDs, mapeando os status antigos para os novos IDs de coluna
    console.log('🔄 Recriando leads com colunas corretas...');
    const statusMapping = {
      'novo': 'novo',
      'em-contato': 'em-contato', 
      'em_contato': 'em-contato',
      'qualificado': 'qualificado',
      'negociacao': 'negociacao',
      'negociação': 'negociacao',
      'fechado': 'fechado',
      'pagamento': 'fechado', // Mapear Pagamento para Fechado
      'rejeitou': 'novo' // Mapear Rejeitou para Novo
    };
    
    for (const lead of allLeads) {
      const newColumnId = statusMapping[lead.columnId] || statusMapping[lead.status] || 'novo';
      
      await prisma.lead.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: newColumnId.replace('-', '_'), // Ajustar status para snake_case
          notes: lead.notes,
          columnId: newColumnId,
          position: lead.position
        }
      });
      console.log(`✅ Lead recriado: ${lead.name} -> ${newColumnId}`);
    }
    
    console.log('🎉 Correção das colunas concluída com sucesso!');
    
    // Verificar o resultado final
    const finalColumns = await prisma.column.findMany({
      orderBy: { position: 'asc' },
      include: { leads: true }
    });
    
    console.log('\n📋 Colunas finais:');
    finalColumns.forEach(col => {
      console.log(`- ${col.title} (${col.leads.length} leads)`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao corrigir colunas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKanbanColumns();