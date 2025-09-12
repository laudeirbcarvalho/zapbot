import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Criar dados de exemplo seguindo o formato: Coluna A: Nome, Coluna B: Email, Coluna C: Telefone, Coluna D: Origem
    const exampleData = [
      ['Nome', 'Email', 'Telefone', 'Origem'],
      ['João Silva', 'joao@email.com', '(11) 99999-9999', 'Site'],
      ['Maria Santos', 'maria@email.com', '(11) 88888-8888', 'Facebook'],
      ['Pedro Oliveira', 'pedro@email.com', '(11) 77777-7777', 'Google Ads'],
      ['Ana Costa', 'ana@email.com', '(11) 66666-6666', 'Indicação'],
      ['Carlos Ferreira', 'carlos@email.com', '(11) 55555-5555', 'WhatsApp']
    ];

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(exampleData);
    
    // Definir largura das colunas
    worksheet['!cols'] = [
      { width: 20 }, // Nome
      { width: 25 }, // Email
      { width: 18 }, // Telefone
      { width: 15 }  // Origem
    ];
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exemplo Leads');
    
    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Retornar arquivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="exemplo-leads.xlsx"'
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar planilha de exemplo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}