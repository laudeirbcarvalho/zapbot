const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumnColors() {
  try {
    console.log('🎨 Adicionando cores às colunas do Kanban...');
    
    // Definir cores padrão para as colunas
    const columnColors = [
      { id: 'novo', color: '#3B82F6' },           // Azul
      { id: 'em-contato', color: '#F59E0B' },    // Amarelo
      { id: 'qualificado', color: '#8B5CF6' },   // Roxo
      { id: 'negociacao', color: '#EF4444' },    // Vermelho
      { id: 'fechado', color: '#10B981' }        // Verde
    ];
    
    // Buscar todas as colunas existentes
    const existingColumns = await prisma.column.findMany();
    console.log(`📋 Encontradas ${existingColumns.length} colunas`);
    
    // Atualizar cores das colunas
    for (const columnData of columnColors) {
      const existingColumn = existingColumns.find(col => 
        col.id === columnData.id || 
        col.title.toLowerCase().includes(columnData.id.replace('-', ' '))
      );
      
      if (existingColumn) {
        await prisma.column.update({
          where: { id: existingColumn.id },
          data: { color: columnData.color }
        });
        console.log(`✅ Cor atualizada para coluna "${existingColumn.title}": ${columnData.color}`);
      } else {
        console.log(`⚠️ Coluna não encontrada para: ${columnData.id}`);
      }
    }
    
    // Se houver colunas sem cor definida, aplicar cores aleatórias
    const columnsWithoutColor = await prisma.column.findMany({
      where: {
        color: '#6B7280' // Cor padrão do schema
      }
    });
    
    const additionalColors = ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#84CC16'];
    
    for (let i = 0; i < columnsWithoutColor.length; i++) {
      const column = columnsWithoutColor[i];
      const color = additionalColors[i % additionalColors.length];
      
      await prisma.column.update({
        where: { id: column.id },
        data: { color: color }
      });
      console.log(`✅ Cor padrão aplicada para coluna "${column.title}": ${color}`);
    }
    
    console.log('🎉 Cores das colunas atualizadas com sucesso!');
    
    // Mostrar resultado final
    const finalColumns = await prisma.column.findMany({
      orderBy: { position: 'asc' }
    });
    
    console.log('\n🎨 Colunas com cores:');
    finalColumns.forEach(col => {
      console.log(`- ${col.title}: ${col.color || 'Sem cor'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar cores às colunas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addColumnColors();